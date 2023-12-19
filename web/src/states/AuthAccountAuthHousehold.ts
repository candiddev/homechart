import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";

import { API } from "../services/API";
import type { Permissions } from "../types/Permission";
import { Permission } from "../types/Permission";
import { ObjectAccountInvited, ObjectChildCreated, ObjectInviteDeleted, ObjectMemberDeleted, ObjectMemberUpdated, WebGlobalActionJoinHouseholdMessage, WebGlobalActionLeaveHouseholdMessage } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import type { AuthHousehold } from "./AuthHousehold";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { SSEState } from "./SSE";

export interface AuthAccountAuthHousehold {
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	child: boolean,
	color: string,
	created: NullTimestamp,
	emailAddress: string,
	id: NullUUID,
	inviteToken: string,
	name: string,
	permissions: Permissions,
	updated: NullTimestamp,
}

export const AuthAccountAuthHouseholdState = {
	delete: async (authHouseholdID: NullUUID, id: NullUUID): Promise<void> => {
		return API.delete(`/api/v1/auth/households/${authHouseholdID}/members/${id}`)
			.then(async () => {
				await AuthSessionState.validate();

				if (id === AuthAccountState.data().id) {
					SSEState.clearRefreshed();
				}

				AppState.setLayoutAppAlert({
					message: id === AuthAccountState.data().id ?
						AuthAccountState.translate(WebGlobalActionLeaveHouseholdMessage) :
						AuthAccountState.translate(ObjectMemberDeleted),
				});
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	},
	inviteAccept: async (token: string): Promise<AuthHousehold | Err> => {
		return API.read(`/api/v1/auth/households/${AuthAccountState.data().id}/invites/${token}`, {}) // Household ID doesn't matter
			.then(async (err) => {
				if (IsErr(err)) {
					return err;
				}

				SSEState.clearRefreshed();
				await AuthAccountState.read();
				await AuthSessionState.validate();
				return AuthHouseholdState.read(AuthAccountState.data().primaryAuthHouseholdID, undefined, true);
			})
			.then((authHousehold) => {
				if (IsErr(authHousehold)) {
					return authHousehold;
				}

				if (authHousehold !== undefined) {
					AuthHouseholdState.set(authHousehold);

					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(WebGlobalActionJoinHouseholdMessage),
					});

					return authHousehold;
				}

				return AuthHouseholdState.new();
			});
	},
	inviteCreate: async (data: AuthAccountAuthHousehold): Promise<void | Err> => {
		return API.create(`/api/v1/auth/households/${data.authHouseholdID}/invites`, data)
			.then((err) => {
				if (IsErr(err)) {
					return err;
				}

				if (data.child) {
					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(ObjectChildCreated),
					});
				} else {
					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(ObjectAccountInvited),
					});
				}

				return;
			});
	},
	inviteDelete: async (authHouseholdID: NullUUID, id: NullUUID): Promise<void | Err> => {
		return API.delete(`/api/v1/auth/households/${authHouseholdID}/invites/${id}`)
			.then(async () => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectInviteDeleted),
				});
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	},
	is: (data: unknown): data is AuthAccountAuthHousehold => {
		return data !== null;
	},
	new: (): AuthAccountAuthHousehold => {
		return {
			authAccountID: null,
			authHouseholdID: null,
			child: false,
			color: "",
			created: null,
			emailAddress: "",
			id: null,
			inviteToken: "",
			name: "",
			permissions: Permission.new(),
			updated: null,
		};
	},
	update: async (data: AuthAccountAuthHousehold): Promise<void> => {
		return API.update(`/api/v1/auth/households/${data.authHouseholdID}/members/${data.id}`, data)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectMemberUpdated),
				});
			});
	},
};
