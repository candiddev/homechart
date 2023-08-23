import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { FormOverlayBudgetPayee } from "./FormOverlayBudgetPayee";

test("FormOverlayBudgetPayee", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetCategoryState.data(seed.budgetCategories);
	BudgetPayeeState.data(seed.budgetPayees);
	BudgetPayeeState.create = vi.fn();
	BudgetPayeeState.delete = vi.fn();
	BudgetPayeeState.update = vi.fn();

	const budgetPayee = {
		...BudgetPayeeState.new(),
		...{
			id: UUID.new(),
		},
	};

	testing.mount(FormOverlayBudgetPayee, {
		data: budgetPayee,
	});

	// Buttons
	testing.find("#form-update-payee");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(BudgetPayeeState.delete)
		.toBeCalledTimes(1);
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(BudgetPayeeState.update)
		.toBeCalledTimes(1);
	budgetPayee.id = null;
	testing.redraw();
	testing.click("#button-add");
	expect(BudgetPayeeState.create)
		.toBeCalledTimes(1);
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	testing.redraw();

	testing.find("#form-item-owner");

	testing.findAll("#form-item-datalist-name > option", seed.budgetPayees.length);
	testing.input("#form-item-input-name", "bread");
	expect(budgetPayee.name)
		.toBe("bread");
	testing.input("#form-item-text-area-address", "123");
	expect(budgetPayee.address)
		.toBe("123");
	testing.input("#form-item-input-icon", "test");
	expect(budgetPayee.icon)
		.toBe("test");
	testing.input("#form-item-select-default-category", "Food > Groceries");
	expect(budgetPayee.budgetCategoryID)
		.toBe(BudgetCategoryState.findGroupName("Food > Groceries").id);
	testing.mocks.route = "/shop";
	testing.redraw();
	await testing.sleep(100);
	testing.notFind("#form-item-select-default-category");
	testing.click("#form-checkbox-input-shopping-store");
	expect(budgetPayee.shopStore)
		.toBeTruthy();
	testing.input("#form-item-input-name", BudgetPayeeState.data()[1].name);
	expect(budgetPayee.budgetCategoryID)
		.toStrictEqual(BudgetPayeeState.data()[1].budgetCategoryID);
});
