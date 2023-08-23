import type { Err } from "@lib/services/Log";
import { Log, NewErr } from "@lib/services/Log";
import localforage from "localforage";

export const IndexedDB = {
	clear: async (): Promise<void> => {
		await localforage.clear()
			.then(() => {
				Log.debug("IndexedDB clear");
			})
			.catch((err: unknown) => {
				NewErr(`IndexedDB.clear:\n${err}`, "");
			});
	},
	delete: async (key: string): Promise<void> => {
		await localforage.removeItem(key)
			.then(() => {
				Log.debug(`IndexedDB.delete ${key}`);
			})
			.catch((err: unknown) => {
				NewErr(`IndexedDB.delete ${key}:\n${err}`, "");
			});
	},
	get: async (key: string): Promise<unknown | Err> => {
		return localforage.getItem(key)
			.then((data: unknown) => {
				Log.debug(`IndexedDB get ${key}: ${JSON.stringify(data)}`);
				return data;
			})
			.catch((err) => {
				return NewErr(`IndexedDB.get ${key}:\n${err}`, "Error retrieving value from cache");
			});
	},
	init: (): void => {
		localforage.config({
			name: "homechart",
			storeName: "data",
			version: 1.0,
		});
	},
	set: async (key: string, value: unknown): Promise<void | Err> => {
		return localforage.setItem(key, value)
			.then(() => {
				Log.debug(`IndexedDB.set ${key}:\n${JSON.stringify(value)}`);
			})
			.catch((err: unknown) => {
				return NewErr(`IndexedDB.set ${key}:\n${err}`, "Error retrieving value from cache");
			});
	},
};
