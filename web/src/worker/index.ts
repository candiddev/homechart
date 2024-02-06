import type { WorkerMessage, WorkerResponse } from "./Handler";
import { WorkerAction } from "./Handler";
import Worker from "./Worker?worker";

export const Controller: {
  dispatch<T extends WorkerMessage>(msg: T): void;
  init(onmessage: (event: WorkerResponse) => void): void;
  /** Next worker ID. */
  nextID: number;

  /** A pool of workers. */
  workerPool: Worker[];
} = {
  dispatch: <T extends WorkerMessage>(msg: T): void => {
    // Send reset to every worker.
    if (msg.action === WorkerAction.Reset) {
      Controller.workerPool.map((worker) => {
        worker.postMessage(msg);
      });
    } else {
      Controller.workerPool[Controller.nextID].postMessage(msg);
      Controller.nextID++;

      if (Controller.nextID > Controller.workerPool.length - 1) {
        Controller.nextID = 0;
      }
    }
  },
  init: (onmessage: (res: WorkerResponse) => void) => {
    Controller.workerPool = [
      ...Array(process.env.NODE_ENV === "test" ? 1 : 2),
    ].map(() => {
      const w = new Worker();
      w.addEventListener("message", (event) => {
        onmessage(event.data);
      });

      return w;
    });
  },
  nextID: 0,
  workerPool: typeof window === "undefined" ? [] : [new Worker()],
};
