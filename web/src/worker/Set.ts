import { IndexedDB } from "../services/IndexedDB";
import type { WorkerAction, WorkerMessage } from "./Handler";

export interface WorkerMessageSet extends WorkerMessage {
  /** Using the Set action. */
  action: WorkerAction.Set;

  /** Arguments for the Set action. */
  arguments: {
    /** Data to set. */
    data: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    /** Key to set the data under. */
    type: string;
  };
}

export async function SetWkr(msg: WorkerMessageSet): Promise<void> {
  await IndexedDB.set(msg.arguments.type, msg.arguments.data);
}
