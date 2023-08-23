import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import { API, ErrUnknownResponse } from "../services/API";
import { ObjectNotificationCreated, ObjectNotificationDeleted, ObjectNotificationUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";

export interface Notification { // TODO: Make webpush work via Admin
	authAccountID: NullUUID,
	bodySMTP: string,
	created: NullTimestamp,
	id: NullUUID,
	newsletter: boolean,
	sendAfter: NullTimestamp,
	subjectSMTP: string,
	toSMTP: string,
}

export const NotificationState = {
	create: async (data: Notification): Promise<void> => {
		return API.create("/api/v1/notifications", data)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectNotificationCreated),
				});
			});
	},
	delete: async (id: NullUUID): Promise<void> => {
		return API.delete(`/api/v1/notifications/${id}`)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectNotificationDeleted),
				});
			});
	},
	inResponse: (response: APIResponse<unknown>): response is APIResponse<Notification[]> => {
		return response.dataType === "Notifications";
	},
	is: (value: unknown): value is Notification => {
		return value !== null;
	},
	new: (): Notification => {
		const after = Timestamp.now();

		after.addMinutes(10);
		return {
			authAccountID: null,
			bodySMTP: "",
			created: null,
			id: null,
			newsletter: false,
			sendAfter: after.toString(),
			subjectSMTP: "",
			toSMTP: "",
		};
	},
	read: async (): Promise<Notification[] | Err> => {
		return API.read("/api/v1/notifications", {})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (NotificationState.inResponse(response)) {
					return response.dataValue;
				}

				return ErrUnknownResponse;
			});
	},
	update: async (data: Notification): Promise<void> => {
		return API.update(`/api/v1/notifications/${data.id}`, data)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectNotificationUpdated),
				});
			});
	},
};

