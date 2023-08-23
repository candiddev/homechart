import { IndexedDB } from "./IndexedDB";

describe("IndexedDB", () => {
	test("clear", async () => {
		await IndexedDB.set("key", "value");

		await IndexedDB.clear();

		expect(await IndexedDB.get("key"))
			.toBeNull();
	});
	test("delete", async () => {
		await IndexedDB.set("key", "value");

		await IndexedDB.delete("key");

		expect(await IndexedDB.get("key"))
			.toBeNull();
	});
	test("get/set", async () => {
		await IndexedDB.set("key", "value");

		expect(await IndexedDB.get("key"))
			.toBe("value");
	});
});
