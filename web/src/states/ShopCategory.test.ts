import seed from "../jest/seed";
import { ShopCategoryState } from "./ShopCategory";

describe("ShopCategoryState", () => {
	test("data", () => {
		ShopCategoryState.data(seed.shopCategories);
		ShopCategoryState.data([]);
	});

	test("findMatch", () => {
		ShopCategoryState.data([
			...seed.shopCategories,
			{
				...ShopCategoryState.new(),
				...{
					match: "",
					name: "Bad",
				},
			},
		]);

		expect(ShopCategoryState.findMatch("donut"))
			.toStrictEqual(seed.shopCategories[4]);
		expect(ShopCategoryState.findMatch("notamatch"))
			.toStrictEqual(ShopCategoryState.new());
	});
});
