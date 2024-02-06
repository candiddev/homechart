import type { FilterSortChildrenArguments } from "@lib/utilities/FilterSortChildren";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";

import type { WorkerMessage, WorkerResponse } from "./Handler";
import { WorkerAction } from "./Handler";

export interface WorkerMessageFilterSortChildren extends WorkerMessage {
  /** The worker action that is being performed. */
  action: WorkerAction.FilterSortChildren;

  /** Only use the FilterSortChildren arguments. */
  arguments: FilterSortChildrenArguments<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface WorkerResponseFilterSortChildren extends WorkerResponse {
  /** Using the FilterSortChildren action. */
  action: WorkerAction.FilterSortChildren;

  /** Data returned by function. */
  data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function FilterSortChildrenWkr(
  msg: WorkerMessageFilterSortChildren,
): Promise<WorkerResponseFilterSortChildren> {
  return new Promise((resolve) => {
    return resolve({
      action: WorkerAction.FilterSortChildren,
      data: FilterSortChildren(msg.arguments),
      type: msg.type,
    });
  });
}
