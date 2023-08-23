import { API } from "../services/API";
import type { DataTypeEnum } from "../types/DataType";
import type { WorkerMessageFilterSortChildren } from "./FilterSortChildren";
import { FilterSortChildrenWkr } from "./FilterSortChildren";
import type { WorkerMessageRead } from "./Read";
import { ReadWkr } from "./Read";
import type { WorkerMessageReadAll } from "./ReadAll";
import { ReadAllWkr } from "./ReadAll";
import type { WorkerMessageSet } from "./Set";
import { SetWkr } from "./Set";

const ctx: Worker = self as any // eslint-disable-line

export enum WorkerAction {
	FilterSortChildren,
	Read,
	ReadAll,
	Reset,
	Set,
}

export interface WorkerMessage {
	/** The action the worker should perform. */
	action: WorkerAction,

	/** The arguments to pass to the action. */
	arguments: unknown,

	/** The type of data being acted upon. */
	type: DataTypeEnum,
}

export interface WorkerResponse {
	/** The action that was performed. */
	action: WorkerAction,

	/** The data returned from the action. */
	data: unknown,

	/** The type of data being returned. */
	type: DataTypeEnum,
}

export async function Handler (msg: WorkerMessage): Promise<void> {
	switch (msg.action) {
	case WorkerAction.FilterSortChildren:
		return FilterSortChildrenWkr(msg as WorkerMessageFilterSortChildren)
			.then((res) => {
				ctx.postMessage(res);
			});
	case WorkerAction.Read:
		return ReadWkr(msg as WorkerMessageRead)
			.then((res) => {
				ctx.postMessage(res);
			});
	case WorkerAction.ReadAll:
		return ReadAllWkr(msg as WorkerMessageReadAll)
			.then((res) => {
				ctx.postMessage(res);
			});
	case WorkerAction.Reset:
		return API.clearAPIEndpoint();
	case WorkerAction.Set:
		return SetWkr(msg as WorkerMessageSet); // eslint-disable-line @typescript-eslint/consistent-type-assertions
	}
}
