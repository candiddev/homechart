/* eslint-disable @typescript-eslint/no-floating-promises,@typescript-eslint/promise-function-async */

import "./states/Global";

import { IsErr, Log } from "@lib/services/Log";
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches,precacheAndRoute } from "workbox-precaching";

import { IndexedDB } from "./services/IndexedDB";
import { PlanTaskState } from "./states/PlanTask";

declare let self: any; // eslint-disable-line @typescript-eslint/no-explicit-any

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();

IndexedDB.init();

interface webPushData {
	actions: webPushDataActions,
	body: string,
	subject: string,
}

interface webPushDataActions {
	default: string,
	target: string,
	targetType: string,
	types: number[] | null,
}

function showNotification (data: webPushData): void {
	self.registration.showNotification(data.subject, {
		actions: data.actions.types === null ?
			[] :
			data.actions.types.map((t) => {
				return webPushActionTypes[t];
			}),
		badge: "/homechart_badge_202202261.png",
		body: data.body,
		data: data,
		icon: "/homechart_512_202312171.png",
	});
}

const webPushActionTypes: {
	action: string,
	onclick: (data: webPushData) => Promise<void>,
	title: string,
}[] = [
	{
		action: "task-complete",
		onclick: async (data): Promise<void> => {
			const err = await PlanTaskState.readAllSync();

			if (! IsErr(err)) {
				await PlanTaskState.updateDone(PlanTaskState.findID(data.actions.target));

				PlanTaskState.data([]);
			}
		},
		title: "Mark Complete",
	},
	{
		action: "snooze",
		onclick: async (data): Promise<void> => {
			self.setTimeout(async () => {
				showNotification(data);
			}, 1000 * 60 * 5); // 5 minutes
		},
		title: "Snooze",
	},
];

self.addEventListener("push", (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
	let data: webPushData = {
		actions: {
			default: "",
			target: "",
			targetType: "",
			types: null,
		},
		body: "",
		subject: "",
	};

	if (event.data !== null) {
		data = event.data.json();
	}

	event.waitUntil(showNotification(data));
});

self.addEventListener("notificationclick", (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
	event.notification.close();

	const data: webPushData = event.notification.data;

	if (event.action === "") {
		event.waitUntil(self.clients.openWindow(data === null || data.actions.default === "" ?
			"/home" :
			data.actions.default));
	}

	for (let i = 0; i < webPushActionTypes.length; i++) {
		if (webPushActionTypes[i].action === event.action) {
			return webPushActionTypes[i].onclick(data);
		}
	}

	return;
});

Log.debug("Service worker initialized");
