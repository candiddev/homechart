import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopStores } from "./ShopStores";

test("ShopStores", async () => {
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetPayeeState.data(seed.budgetPayees);
	ShopCategoryState.data(seed.shopCategories);

	testing.mount(App, routeOptions, ShopStores);
	testing.title("Shop - Stores");
	testing.text("#table-header-name", "Namearrow_downward");
	testing.findAll("tbody tr", 5);
	testing.text(`#table-data-${seed.budgetPayees[1].id}-name`, seed.budgetPayees[1].name);
	testing.text(`#table-data-${seed.budgetPayees[1].id}-address`, seed.budgetPayees[1].address);
	testing.click(`#table-row_${seed.budgetPayees[1].id}`);
	testing.find("#button-update");
	testing.value("#form-item-input-name", seed.budgetPayees[1].name);
	testing.value("#form-item-text-area-address", seed.budgetPayees[1].address);
	testing.input("#form-item-input-name", "111");
	testing.text(`#table-data-${seed.budgetPayees[1].id}-name`, seed.budgetPayees[1].name);
	testing.click("#button-delete");
	testing.mocks.responses.push({});
	testing.click("#button-confirm-delete");
	await testing.sleep(100);
	BudgetPayeeState.data(seed.budgetPayees.slice(1, 3));
	await testing.sleep(100);
	testing.redraw();
	testing.notFind("#button-cancel");
	testing.findAll("tbody tr", 2);
});
