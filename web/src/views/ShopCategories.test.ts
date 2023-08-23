import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopCategories } from "./ShopCategories";

test("ShopCategories", async () => {
	const categories = [
		{
			...ShopCategoryState.new(),
			...{
				budgetPayeeID: seed.budgetPayees[0].id,
				id: "1",
				match: "apples|bananas|carrots|donuts|eggs",
				name: "a",
			},
		},
		{
			...ShopCategoryState.new(),
			...{
				budgetPayeeID: seed.budgetPayees[1].id,
				id: "2",
				match: "b",
				name: "b",
			},
		},
		{
			...ShopCategoryState.new(),
			...{
				budgetPayeeID: seed.budgetPayees[2].id,
				id: "3",
				match: "c",
				name: "c",
			},
		},
	];

	BudgetPayeeState.data(seed.budgetPayees);
	ShopCategoryState.data(categories);

	testing.mount(App, routeOptions, ShopCategories);
	testing.title("Shop - Categories");
	testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
	testing.findAll("tbody tr", 3);
	testing.text("#table-data-1-name", categories[0].name);
	testing.text("#table-data-1-match", "applesbananascarrotsdonuts...");
	testing.text("#table-data-1-shopstoreid", seed.budgetPayees[0].name);
	testing.click("#table-row_1");
	testing.input("#form-item-input-name", "111");
	testing.click("#button-delete");
	testing.mocks.responses.push({});
	testing.click("#button-confirm-delete");
	ShopCategoryState.data(categories.splice(1, 3));
	await testing.sleep(100);
	testing.redraw();
	testing.notFind("#button-cancel");
	testing.findAll("tbody tr", 2);
});
