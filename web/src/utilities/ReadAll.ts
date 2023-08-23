import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { Clone } from "@lib/utilities/Clone";
import { FindLastUpdated } from "@lib/utilities/FindLastUpdated";
import { Sort } from "@lib/utilities/Sort";

import { API } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import { MergeData } from "./MergeData";

export interface ReadAllArguments<T extends Data> {
	/** Existing data to compare/merge. */
	data: T[],

	/** Existing hash to compare. */
	hash: string,

	/** What a new object is to compare properties. */
	newObj: T,

	/** Path on the API to read. */
	path: string,

	/** Field to sort by. */
	sortField: string,

	/** Should the sort be inverted. */
	sortInvert: boolean,

	/** Name of the type array to compare. */
	typeArray: string,
}

export interface ReadAllResponse<T extends Data> {
	/** Data returned by API. */
	data?: T[],

	/** Hash returned by the API. */
	hash: string,

	/** If the API is offline. */
	offline: boolean,
}

export async function ReadAll<T extends Data> (args: ReadAllArguments<T>): Promise<ReadAllResponse<T> | Err> {
	let hash = args.hash;
	let newData: T[] = [];
	let updated: NullTimestamp | undefined;

	if (args.data.length === 0) {
		const result = await IndexedDB.get(args.typeArray) as T[];
		if (result !== undefined && result !== null && Array.isArray(result) && result.length > 0 && Object.keys(result[0]).length === Object.keys(args.newObj).length) {
			newData = result;
			const h = await IndexedDB.get(`${args.typeArray}_hash`);
			if (typeof h === "string") {
				hash = h;
			}

			updated = FindLastUpdated(newData);
		}
	} else {
		newData = Clone(args.data);
		updated = FindLastUpdated(args.data);
	}

	return API.read(args.path, {
		hash: hash,
		updated: updated,
	})
		.then(async (response) => {
			if (IsErr(response)) {
				return response;
			}

			if (response.status === 0) {
				return {
					data: newData,
					hash: hash,
					offline: true,
					typeArray: args.typeArray,
				};
			}

			if (response.status === 204) {
				return {
					data: newData,
					hash: hash,
					offline: false,
					typeArray: args.typeArray,
				};
			}

			if (response.status === 403 || response.status === 410) {
				await IndexedDB.delete(args.typeArray);
				await IndexedDB.delete(`${args.typeArray}_hash`);

				return {
					hash: "",
					offline: false,
					typeArray: args.typeArray,
				};
			}

			if (response.dataType !== args.typeArray) {
				NewErr(`ReadAll: unknown API response for ${args.typeArray}: ${response.dataType} ${JSON.stringify(response.dataValue)}`);

				return {
					hash: hash,
					offline: false,
					typeArray: args.typeArray,
				};
			}

			let changed = true;

			// If dataIDs aren't [], means we have a partial update and need to merge
			if (response.dataIDs.length > 0) {
				const merge = await MergeData(newData, args.path, response.dataValue as T[], response.dataIDs); // eslint-disable-line @typescript-eslint/consistent-type-assertions

				changed = merge.changed;
				newData = merge.data;
			} else {
				changed = true;
				newData = response.dataValue as T[];
			}

			// If data has really changed, save and return.
			if (changed) {
				// Array types should be sorted
				Sort(newData, {
					invert: args.sortInvert,
					property: args.sortField,
				});

				await IndexedDB.set(args.typeArray, newData);
			}

			if (response.dataHash !== "") {
				hash = response.dataHash;

				await IndexedDB.set(`${args.typeArray}_hash`, hash);
			}

			return {
				data: newData,
				hash: hash,
				offline: false,
				typeArray: args.typeArray,
			};
		});
}
