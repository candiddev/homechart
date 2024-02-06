import { IndexedDB } from "../services/IndexedDB";
import { Handler } from "./Handler";

IndexedDB.init();

export default class {
  // eslint-disable-next-line
  addEventListener(_type: string, listener: (event: any) => any): void {
    // eslint-disable-next-line
    self.postMessage = (msg: any) => {
      listener({
        data: msg,
      });
    };
  }

  // eslint-disable-next-line
  onmessage(_event: any): void {
    return;
  }

  // eslint-disable-next-line
  async postMessage(msg: any): Promise<void> {
    return Handler({ ...msg });
  }

  terminate(): void {
    return;
  }
}
