import type { Err } from "@lib/services/Log";

import type { ReadArguments, ReadResponse } from "../utilities/Read";
import { read } from "../utilities/Read";
import type { WorkerMessage, WorkerResponse } from "./Handler";
import { WorkerAction } from "./Handler";

export interface WorkerMessageRead extends WorkerMessage {
	/** Using the Read function. */
	action: WorkerAction.Read,

	/** Arguments to pass to the Read function. */
	arguments: ReadArguments,
}

export interface WorkerResponseRead extends WorkerResponse {
	/** Using the Read action. */
	action: WorkerAction.Read,

	/** Response from the Read function. */
	data: ReadResponse<any> | Err, // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function ReadWkr (msg: WorkerMessageRead): Promise<WorkerResponseRead> {
	return read(msg.arguments)
		.then((res) => {
			return {
				action: WorkerAction.Read,
				data: res,
				type: msg.type,
			};
		});
}
