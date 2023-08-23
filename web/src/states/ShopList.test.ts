import seed from "../jest/seed";
import { ShopListState } from "./ShopList";

describe("ShopListState", () => {
	test("data", () => {
		ShopListState.data(seed.shopLists);
		ShopListState.data([]);
	});
});
