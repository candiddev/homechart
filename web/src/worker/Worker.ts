import { IndexedDB } from "../services/IndexedDB";
import type { WorkerMessage } from "./Handler";
import { Handler } from "./Handler";
import WorkerMock from "./WorkerMock";

export default WorkerMock; // needed for service worker importing web worker

const ctx: Worker = self as any // eslint-disable-line

IndexedDB.init();

let busy = false;
const queue: MessageEvent<WorkerMessage>[] = [];

ctx.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
	if (busy) {
		queue.push(event);
	} else {
		busy = true;
		await Handler(event.data); // eslint-disable-line @typescript-eslint/consistent-type-assertions

		while (queue.length > 0) {
			await Handler(queue.shift()!.data); // eslint-disable-line @typescript-eslint/no-non-null-assertion
		}

		busy = false;
	}
});
