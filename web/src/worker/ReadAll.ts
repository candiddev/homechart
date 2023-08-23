import type { Err } from "@lib/services/Log";

import type { ReadAllArguments, ReadAllResponse } from "../utilities/ReadAll";
import { ReadAll } from "../utilities/ReadAll";
import type { WorkerMessage, WorkerResponse } from "./Handler";
import { WorkerAction } from "./Handler";

export interface WorkerMessageReadAll extends WorkerMessage {
	/** Using the ReadAll action. */
	action: WorkerAction.ReadAll,

	/** Arguments to pass to the ReadAll function. */
	arguments: ReadAllArguments<Data>,
}

export interface WorkerResponseReadAll extends WorkerResponse {
	/** Using the ReadAll action. */
	action: WorkerAction.ReadAll,

	/** Data from the ReadAll function. */
	data: ReadAllResponse<any> | Err, // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function ReadAllWkr (msg: WorkerMessageReadAll): Promise<WorkerResponseReadAll> {
	return ReadAll(msg.arguments)
		.then((res) => {
			return {
				action: WorkerAction.ReadAll,
				data: res,
				type: msg.type,
			};
		});
}
