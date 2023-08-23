import { EncryptionTypeRSA2048, EncryptValue, ParseEncryptedValue } from "@lib/encryption/Encryption";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Icons } from "@lib/types/Icons";
import { Clone } from "@lib/utilities/Clone";
import Stream from "mithril/stream";

import { DataTypeEnum } from "../types/DataType";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectVaultCreated, ObjectVaultDeleted, ObjectVaultUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface SecretsVault {
	[key: string]: SecretsVaultKey[] | boolean | null | number | string | undefined,
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	created: NullTimestamp,
	icon: string,
	id: NullUUID,
	keys: SecretsVaultKey[],
	name: string,
	shortID: string,
	updated: NullTimestamp,
}

export interface SecretsVaultKey {
	authAccountID: string,
	key: string,
}

class SecretsVaultManager extends DataArrayManager<SecretsVault> {
	constructor () {
		super("/api/v1/secrets/vaults", "name", false, DataTypeEnum.SecretsVault);

		Stream.lift(async (key, vaults) => {
			if (key === "") {
				this.keys({});

				return;
			}

			const keys = Clone(this.keys());
			let changed = false;

			for (let i = 0; i < vaults.length; i++) {
				const index = this.findKeyIndex(vaults[i].keys);
				if (index < 0 || this.keys()[vaults[i].id as string] !== undefined) {
					continue;
				}

				const e = ParseEncryptedValue(vaults[i].keys[index].key);
				if (! IsErr(e)) {
					const v = await e.decrypt(key);
					if (! IsErr(v)) {
						keys[vaults[i].id as string] = v;
						changed = true;
					}
				}
			}

			if (changed) {
				this.keys(keys);
			}
		}, AuthAccountState.privateKey, this.data);
	}

	keys: Stream<{
		[key: string]: string,
	}> = Stream({});

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";

		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectVaultCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectVaultDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectVaultUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	async deleteKey (s: SecretsVault, authAccountID: NullUUID): Promise<void | Err> {
		const keys = Clone(s.keys);
		const index = this.findKeyIndex(s.keys, authAccountID);

		if (index >= 0) {
			keys.splice(index, 1);

			return this.update({
				...s,
				...{
					keys: keys,
				},
			});
		}
	}

	findKeyIndex (keys: SecretsVaultKey[], authAccountID?: NullUUID): number {
		return keys.findIndex((key) => {
			return key.authAccountID === (authAccountID === undefined ?
				AuthAccountState.data().id :
				authAccountID);
		});
	}

	getIcon (s: SecretsVault): string {
		return s.icon === "" ?
			Icons.SecretsVault :
			s.icon;
	}

	override new (): SecretsVault {
		const p = Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Shop, PermissionEnum.Edit, AuthAccountState.data().primaryAuthHouseholdID);

		return {
			authAccountID:
				p ?
					null :
					AuthAccountState.data().id,
			authHouseholdID:
				p ?
					AuthAccountState.data().primaryAuthHouseholdID :
					null,
			created: null,
			icon: "",
			id: null,
			keys: [],
			name: "",
			shortID: "",
			updated: null,
		};
	}

	async setKey (s: SecretsVault, authAccountID: NullUUID): Promise<void | Err> {
		const m = AuthHouseholdState.findMember(authAccountID);

		if (SecretsVaultState.keys()[s.id as string] === undefined || m.publicKey === "") {
			return;
		}

		const keys = Clone(s.keys);
		const index = this.findKeyIndex(s.keys, authAccountID);

		const key = await EncryptValue(EncryptionTypeRSA2048, m.publicKey, this.keys()[s.id as string]);
		if (IsErr(key)) {
			return key;
		}

		if (index < 0) {
			keys.push({
				authAccountID: authAccountID as string,
				key: key.string(),
			});
		} else if (keys[index].key !== key.string()) {
			keys[index].key = key.string();
		}

		return this.update({
			...s,
			...{
				keys: keys,
			},
		});
	}
}

export const SecretsVaultState = new SecretsVaultManager();
