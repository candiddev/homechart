import { IndexedDB } from "../services/IndexedDB";
import { Handler } from "./Handler";

IndexedDB.init();

export default class {
	addEventListener (_type: string, listener: (event: any) => any): void { // eslint-disable-line
		self.postMessage = (msg: any) => { // eslint-disable-line
			listener({
				data: msg,
			});
		};
	}

	onmessage (_event: any): void { // eslint-disable-line
		return;
	}

	async postMessage (msg: any): Promise<void> { // eslint-disable-line
		return Handler({ ...msg });
	}

	terminate (): void {
		return;
	}
}
