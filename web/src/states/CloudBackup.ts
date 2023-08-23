import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";

import { API, ErrUnknownResponse } from "../services/API";
import { ObjectBackupCreated, ObjectBackupDeleted } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { InfoState } from "./Info";

export interface CloudBackup {
	created: NullTimestamp,
	id: NullUUID,
}

export const CloudBackupState = {
	create: async (authHouseholdID: NullUUID): Promise<void | Err> => {
		return API.create(`/api/v1/cloud/${authHouseholdID}/backups`)
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectBackupCreated),
				});

				return;
			});
	},
	delete: async (authHouseholdID: NullUUID, id: NullUUID): Promise<void | Err> => {
		return API.delete(`/api/v1/cloud/${authHouseholdID}/backups/${id}`)
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}

				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectBackupDeleted),
				});

				return;
			});
	},
	inResponse (response: APIResponse<unknown>): response is APIResponse<CloudBackup[]> {
		return response.dataType === "CloudBackups";
	},
	is (data: unknown): data is CloudBackup {
		return data !== null;
	},
	new: (): CloudBackup => {
		return {
			created: null,
			id: null,
		};
	},
	readAll: async (authHouseholdID: NullUUID): Promise<CloudBackup[] | Err> => {
		if (InfoState.data().cloud) {
			return new Promise((resolve) => {
				return resolve([]);
			});
		}
		return API.read(`/api/v1/cloud/${authHouseholdID}/backups`, {})
			.then((response) => {
				if (IsErr(response)) {
					AppState.setLayoutAppAlert(response);
					return response;
				}

				if (CloudBackupState.inResponse(response)) {
					return response.dataValue;
				}

				AppState.setLayoutAppAlert(ErrUnknownResponse);
				return ErrUnknownResponse;
			});
	},
	restore: async (authHouseholdID: NullUUID, id: NullUUID): Promise<void | Err> => {
		return API.read(`/api/v1/cloud/${authHouseholdID}/backups/${id}`, {})
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}

				return;
			});
	},
};
