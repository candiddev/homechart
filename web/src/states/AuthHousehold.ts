import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { CurrencyEnum } from "@lib/types/Currency";
import { Clone } from "@lib/utilities/Clone";
import { Sort } from "@lib/utilities/Sort";

import { API, ErrUnknownResponse } from "../services/API";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { DataTypeEnum } from "../types/DataType";
import type { PermissionComponentsEnum, PermissionEnum, Permissions } from "../types/Permission";
import { Permission } from "../types/Permission";
import { ObjectHouseholdCreated, ObjectHouseholdDeleted, ObjectHouseholdUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";
import { GlobalState } from "./Global";

export interface AuthHousehold {
	backupEncryptionKey: string,
	created: NullTimestamp,
	id: NullUUID,
	countMembers: number,
	featureVotes: AuthHouseholdFeatureVote[],
	members: AuthHouseholdMember[],
	name: string,
	preferences: AuthHouseholdPreferences,
	selfHostedID: NullUUID,
	selfHostedURL: string,
	subscriptionCustomerID: string,
	subscriptionExpires: NullCivilDate,
	subscriptionID: NullUUID,
	subscriptionLastTransactionID: string,
	subscriptionProcessor: AuthHouseholdSubscriptionProcessorEnum,
	subscriptionReferralCode: string,
	subscriptionReferralCount: number,
	subscriptionReferrerCode: string,
	updated: NullTimestamp,
}

export interface AuthHouseholdFeatureVote {
	amount: number,
	comment: string,
	feature: number,
}

interface AuthHouseholdPreferences {
	[key: string]: number | string | string[],
	colorBudgetRecurrenceEvents: string,
	colorCookMealPlanEvents: string,
	colorPlanTaskEvents: string,
	currency: CurrencyEnum,
	hideComponents: string[],
}

export interface AuthHouseholdMember {
	authHouseholdID: NullUUID,
	child: boolean,
	color: string,
	emailAddress: string,
	id: NullUUID,
	inviteToken: string,
	name: string,
	permissions: Permissions,
	publicKey: string,
}

class AuthHouseholdManager extends DataArrayManager<AuthHousehold> {
	members = this.data.map((households) => {
		const members: AuthHouseholdMember[] = [];

		for (const household of households) {
			if (household.members !== null) {
				for (const member of household.members) {
					members.push(member);
				}
			}
		}

		Sort(members, {
			property: "name",
		});

		return members;
	});
	membersChildren = this.members.map((members) => {
		return members.filter((member) => {
			return member.child;
		});
	});

	constructor () {
		super("/api/v1/auth/households", "name", false, DataTypeEnum.AuthHousehold);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectHouseholdCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectHouseholdDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectHouseholdUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	containsFeatureVote (value: unknown): value is AuthHouseholdFeatureVote {
		return value !== null;
	}

	async deleteMember (authHouseholdID: NullUUID, id: NullUUID): Promise<void> {
		return API.delete(`/api/v1/auth/households/${authHouseholdID}/members/${id}`)
			.then(async () => {
				AppState.setLayoutAppAlert({
					message: "Member deleted",
				});
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	}

	findMember (detail: NullUUID, authHouseholdID?: NullUUID): AuthHouseholdMember {
		if (authHouseholdID === undefined) {
			for (const ah of this.data()) {
				const member = this.findMember(detail, ah.id);
				if (member.id !== null) {
					return member;
				}
			}
		} else {
			const ah = this.findID(authHouseholdID as string);
			const i = ah.members
				.findIndex((member) => {
					return (
						member.id === detail ||
				member.emailAddress === detail ||
				member.name === detail
					);
				});
			if (i >= 0 && ah.members.length > 0) {
				return {
					... this.newMember(),
					...ah.members[i],
				};
			}
		}
		return this.newMember();
	}

	findMemberName (detail: NullUUID, authHouseholdID?: NullUUID): string {
		const member = this.findMember(detail, authHouseholdID);

		if (member.name === "") {
			return member.emailAddress;
		}

		return member.name;
	}

	findMemberNames (authHouseholdID: NullUUID, children?: boolean): string[] {
		if (authHouseholdID === null) {
			const names: string[] = [];

			for (const member of this.members()) {
				if ((member.id === AuthAccountState.data().id || (member.child || children !== true)) && ! names.includes(member.name)) {
					names.push(member.name);
				}
			}

			Sort(names);

			return names;
		}
		const ah = this.findID(authHouseholdID);

		const names = ah.members.filter((member) => {
			return member.id === AuthAccountState.data().id || (member.child || children !== true);
		})
			.map((member) => {
				return member.name;
			});

		Sort(names);

		return names;
	}

	getPermitted (cmp: PermissionComponentsEnum, p: PermissionEnum): AuthHousehold[] {
		return this.data()
			.filter((household) => {
				return Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, cmp, p, household.id);
			});
	}

	isExpired (id: NullUUID): boolean {
		return CivilDate.fromString(this.findID(id).subscriptionExpires!) <= CivilDate.now(); // eslint-disable-line @typescript-eslint/no-non-null-assertion
	}

	isHidden (name: string): boolean {
		if (this.data().length === 0) {
			return false;
		}

		for (const ah of this.data()) {
			if (! ah.preferences.hideComponents.includes(name)) {
				return false;
			}
		}

		return true;
	}

	isMember (data: unknown): data is AuthHouseholdMember {
		return data !== null;
	}

	inResponseFeatureVotes (
		response: APIResponse<unknown>,
	): response is APIResponse<AuthHouseholdFeatureVote[]> {
		return response.dataType === "AuthHouseholdFeatureVotes";
	}

	override new (): AuthHousehold {
		return {
			backupEncryptionKey: "",
			countMembers: 0,
			created: null,
			featureVotes: [],
			id: null,
			members: [],
			name: "",
			preferences: {
				colorBudgetRecurrenceEvents: "",
				colorCookMealPlanEvents: "",
				colorHealthLogsEvents: "",
				colorPlanTaskEvents: "",
				currency: CurrencyEnum.USD,
				hideComponents: [],
			},
			selfHostedID: null,
			selfHostedURL: "",
			subscriptionCustomerID: "",
			subscriptionExpires: null,
			subscriptionID: null,
			subscriptionLastTransactionID: "",
			subscriptionProcessor: AuthHouseholdSubscriptionProcessorEnum.None,
			subscriptionReferralCode: "",
			subscriptionReferralCount: 0,
			subscriptionReferrerCode: "",
			updated: null,
		};
	}

	newFeatureVote (): AuthHouseholdFeatureVote {
		return {
			amount: 0,
			comment: "",
			feature: 0,
		};
	}

	newMember (): AuthHouseholdMember {
		return {
			authHouseholdID: null,
			child: false,
			color: "",
			emailAddress: "",
			id: null,
			inviteToken: "",
			name: "",
			permissions: Permission.new(),
			publicKey: "",
		};
	}

	async readAdmin (filter?: string, offset?: number): Promise<APIResponse<AuthHousehold[]> | Err> {
		return API.read(this.path, {
			filter: filter,
			offset: offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (response.dataValue !== null) {
					return response as APIResponse<AuthHousehold[]>; // eslint-disable-line @typescript-eslint/consistent-type-assertions
				}

				return ErrUnknownResponse;
			});
	}

	override set (data?: AuthHousehold| AuthHousehold[], hash?: string): void {
		if (data !== undefined && ! Array.isArray(data) && data.members === null) {
			for (const household of this.data()) {
				if (household.id === data.id) {
					data.members = household.members;
				}
			}

			if (data.members === null) {
				return;
			}
		}

		const init = this.refreshed;

		super.set(data, hash);

		if (!init) {
			GlobalState.alertSubscription();
		}
	}

	async updateHideComponents (authHouseholdID: NullUUID, component: string): Promise<void | Err> {
		const newComponents: string[] = Clone(this.findID(authHouseholdID).preferences.hideComponents);
		const name = component.toLowerCase();
		const index = newComponents.indexOf(name);

		if (index >= 0) {
			newComponents.splice(index, 1);
		} else {
			newComponents.push(name);
		}

		return this.update({
			...this.findID(authHouseholdID),
			...{
				preferences: {
					...this.findID(authHouseholdID).preferences,
					...{
						hideComponents: newComponents,
					},
				},
			},
		});
	}
}

export const AuthHouseholdState = new AuthHouseholdManager();
