import { IsErr } from "@lib/services/Log";
import { Clone } from "@lib/utilities/Clone";

import { API } from "../services/API";

/*
Scenarios
- newData contains a single object, no oldData (create/update)
- newData contains a single object, with oldData (create/update)
- newData contains an array, no oldData (initial read)
- newData contains an array and ids, with oldData (read with updated)
- only ids with oldData
*/

export async function MergeData<T extends Data> (
	oldDataInput: T[],
	path: string,
	newData?: T | T[],
	ids?: APIResponseDataID[],
): Promise<{
	/** Whether value changed. */
		changed: boolean,

		/** The data output from the merge. */
		data: T[],
	}> {
	let changed = false;
	let mergeData = new Array<T>();
	const oldData = Clone(oldDataInput);

	if (oldData.length === 0 && newData !== undefined) {
		changed = true;
	}

	// Does newData have values
	if (newData !== undefined) {
		if (Array.isArray(newData)) {
			mergeData = Clone(newData);

			// Filter new data from ids
			if (ids !== undefined) {
				for (const data of mergeData) {
					for (let i = ids.length - 1; i >= 0; i--) {
						if (data.id === ids[i].id && data.updated === ids[i].updated) {
							changed = true;
							ids.splice(i, 1);
							i--;
							break;
						}
					}
				}

				const readIDs = [];

				for (const id of ids) {
					let match = false;

					for (let i = oldData.length - 1; i >= 0; i--) {
						if (oldData[i].id === id.id && oldData[i].updated === id.updated) {
							match = true;
							mergeData.push(oldData[i]);
							oldData.splice(i, 1);
							i--;
							break;
						}
					}

					if (!match) {
						readIDs.push(id.id);
					}
				}

				if (readIDs.length >= 10) {
					await API.read(`${path}`, {})
						.then((data) => {
							if (! IsErr(data) && data.dataValue !== null) {
								changed = true;
								mergeData = data.dataValue as T[];
							}
						});
				} else {
					for (const id of readIDs) {
						await API.read(`${path}/${id}`, {})
							.then((data) => {
								if (! IsErr(data) && data.dataValue !== null) {
									changed = true;
									mergeData = mergeData.concat(data.dataValue as T);
								}
							});
					}
				}
			}
		} else {
			changed = true;
			mergeData = oldData;
			const index = mergeData.findIndex((data) => {
				return data.id === newData.id;
			});
			if (index >= 0) {
				mergeData.splice(index, 1);
			}
			mergeData.push(newData);
		}
	}

	return {
		changed: changed || oldData.length > 0,
		data: mergeData,
	};
}
