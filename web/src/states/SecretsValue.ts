import { EncryptionTypeAES128GCM, EncryptValue, ParseEncryptedValue } from "@lib/encryption/Encryption";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { AggregateTags } from "@lib/utilities/AggregateTags";
import { Clone } from "@lib/utilities/Clone";
import { Sort } from "@lib/utilities/Sort";
import { FormItemNewPasswordPassword } from "@lib/yaml8n";
import Stream from "mithril/stream";

import { DataTypeEnum } from "../types/DataType";
import { ObjectValueCreated, ObjectValueDeleted, ObjectValueUpdated, WebGlobalUsername } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";
import { SecretsVaultState } from "./SecretsVault";

export interface SecretsValue {
	[key: string]: {
		[key: string]: string | undefined,
	}[] | boolean | null | number | string | string[] | undefined,
	dataEncrypted: string[],
	deleted: NullUUID,
	id: NullUUID,
	nameEncrypted: string,
	secretsVaultID: NullUUID,
	shortID: string,
	tagsEncrypted: string,
	updated: NullTimestamp,
}

export interface SecretsValueDecrypted extends SecretsValue {
	authHouseholdID: NullUUID,
	data: SecretsValueData[],
	name: string,
	tags: string[],
}

export interface SecretsValueValues {
	[key: string]: SecretsValueValue,
}

interface SecretsValueValue {
	authHouseholdID: NullUUID,
	data: SecretsValueData[],
	name: string,
	secretsVaultID: NullUUID,
	updated: NullTimestamp,
	tags: string[],
}

export interface SecretsValueData {
	[key: string]: string | undefined,
	updated: string,
}

class SecretsValueManager extends DataArrayManager<SecretsValue> {
	defaultProperties = AuthAccountState.data.map(() => {
		return [
			AuthAccountState.translate(WebGlobalUsername),
			AuthAccountState.translate(FormItemNewPasswordPassword),
			"TOTP",
			"URL",
		];
	});

	constructor () {
		super("/api/v1/secrets/values", "name", false, DataTypeEnum.SecretsValue);

		this.names = this.values.map((values) => {
			const names = Object.keys(values)
				.map((id) => {
					return values[id].name;
				});

			Sort(names);

			return names;
		});

		this.tags = this.values.map((values) => {
			return AggregateTags(Object.values(values));
		});

		this.tagNames = this.tags.map((tags) => {
			return tags.map((tag) => {
				return tag.name;
			});
		});

		Stream.lift(async (values, vaults) => {
			const v: SecretsValueValues = {};
			let changed = false;

			for (let i = 0; i < values.length; i++) {
				const key = vaults[values[i].secretsVaultID as string];
				const value = this.getValue(values[i].id);

				if (key === undefined) {
					continue;
				}

				if (value.updated === values[i].updated) {
					v[values[i].id as string] = value;
					continue;
				}

				const data: SecretsValueData[] = [];
				let e;

				for (let j = 0; j < values[i].dataEncrypted.length; j++) {
					e = ParseEncryptedValue(values[i].dataEncrypted[j]);

					if (!IsErr(e)) {
						const s = await e.decrypt(key);

						if (!IsErr(s)) {
							data.push(JSON.parse(s));
						}
					}
				}


				let name = "";
				e = ParseEncryptedValue(values[i].nameEncrypted);
				if (! IsErr(e)) {
					const s = await e.decrypt(key);
					if (! IsErr(s)) {
						name = s;
					}
				}

				let tags = "";
				if (values[i].tagsEncrypted !== "") {
					e = ParseEncryptedValue(values[i].tagsEncrypted);
					if (! IsErr(e)) {
						const s = await e.decrypt(key);
						if (! IsErr(s)) {
							tags = s;
						}
					}
				}

				v[values[i].id as string] = {
					authHouseholdID: SecretsVaultState.findID(values[i].secretsVaultID).authHouseholdID,
					data: data === undefined ?
						[] :
						data,
					name: name,
					secretsVaultID: values[i].secretsVaultID,
					tags: tags === "" ?
						[] :
						JSON.parse(tags),
					updated: values[i].updated,
				};

				changed = true;
			}

			if (changed || Object.keys(v).length !== Object.keys(values).length) {
				this.values(v);
			}
		}, this.data, SecretsVaultState.keys);
	}

	values: Stream<SecretsValueValues> = Stream({});
	properties = this.values.map((values) => {
		const properties = new Set<string>();

		for (let i = 0; i < this.defaultProperties().length; i++) {
			properties.add(this.defaultProperties()[i]);
		}

		for (const key of Object.keys(values)) {
			if (values[key].data.length > 0) {
				for (const property of Object.keys(values[key].data[0])) {
					properties.add(property);
				}
			}
		}

		const arr = Array.from(properties);

		return arr.filter((v) => {
			return v !== "updated";
		});
	});

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";

		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectValueCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectValueDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectValueUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	async encryptValue (s: SecretsValueDecrypted): Promise<SecretsValue | Err> {
		const key = SecretsVaultState.keys()[s.secretsVaultID as string];
		const data = await EncryptValue(EncryptionTypeAES128GCM, key, JSON.stringify(s.data[0]));
		const name = await EncryptValue(EncryptionTypeAES128GCM, key, s.name);
		const tags = await EncryptValue(EncryptionTypeAES128GCM, key, JSON.stringify(s.tags));

		if (IsErr(data)) {
			AppState.setLayoutAppAlert(data);

			return data;
		}

		if (IsErr(name)) {
			AppState.setLayoutAppAlert(name);

			return name;
		}

		if (IsErr(tags)) {
			AppState.setLayoutAppAlert(tags);

			return tags;
		}

		return {
			...SecretsValueState.new(),
			...{
				dataEncrypted: [
					data.string(),
					...s.dataEncrypted.slice(0, 4),
				],
				id: s.id,
				nameEncrypted: name.string(),
				secretsVaultID: s.secretsVaultID,
				tagsEncrypted: tags.string(),
			},
		};
	}

	override findName (name: string, _personal?: boolean): SecretsValue {
		const i = this.data()
			.findIndex((object) => {
				return this.values()[`${object.id}`] !== undefined && this.values()[`${object.id}`].name === name;
			});

		if (i >= 0 && this.data().length > 0) {
			return Clone(this.data()[i]);
		}

		return this.new();
	}

	getValue (id: NullUUID): SecretsValueValue {
		if (id === null || this.values()[id] === undefined) {
			return {
				authHouseholdID: null,
				data: [],
				name: "",
				secretsVaultID: null,
				tags: [],
				updated: null,
			};
		}

		return this.values()[id];
	}

	override new (): SecretsValue {
		return {
			dataEncrypted: [],
			deleted: null,
			id: null,
			nameEncrypted: "",
			secretsVaultID: null,
			shortID: "",
			tagsEncrypted: "",
			updated: null,
		};
	}

	newDecrypted (): SecretsValueDecrypted {
		return {
			authHouseholdID: null,
			data: [],
			dataEncrypted: [],
			deleted: null,
			id: null,
			name: "",
			nameEncrypted: "",
			secretsVaultID: null,
			shortID: "",
			tags: [],
			tagsEncrypted: "",
			updated: null,
		};
	}
}

export const SecretsValueState = new SecretsValueManager();
