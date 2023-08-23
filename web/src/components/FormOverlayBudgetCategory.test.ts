import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetMonthState } from "../states/BudgetMonth";
import { BudgetMonthCategoryState } from "../states/BudgetMonthCategory";
import { PlanProjectState } from "../states/PlanProject";
import { FormOverlayBudgetCategory } from "./FormOverlayBudgetCategory";

test("FormOverlayBudgetCategory", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetCategoryState.create = vi.fn(async () => {
		return Promise.resolve(BudgetCategoryState.new());
	});
	BudgetCategoryState.delete = vi.fn(async () => {
		return Promise.resolve();
	});
	BudgetCategoryState.update = vi.fn(async () => {
		return Promise.resolve();
	});
	BudgetMonthCategoryState.create= vi.fn(async () => {
		return Promise.resolve();
	});
	BudgetMonthState.read = vi.fn(async () => {
		return Promise.resolve();
	});

	const id = UUID.new();

	const budgetCategory = {
		...BudgetMonthCategoryState.new(),
		...{
			authHouseholdID: AuthHouseholdState.data()[0].id,
			budgetCategory: {
				...BudgetCategoryState.new(),
				...{
					id: id,
				},
			},
			budgetCategoryID: id,
			id: id,
			shortID: "1",
		},
	};

	PlanProjectState.data([
		{
			...PlanProjectState.new(),
			...{
				budgetCategoryID: id,
				id: UUID.new(),
				name: "Test",
				shortID: "1",
			},
		},
	]);

	testing.mocks.route = "/budget/categories";

	testing.mount(FormOverlayBudgetCategory, {
		data: budgetCategory,
	});

	// Buttons
	testing.find("#form-update-category");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	await testing.sleep(100);
	expect(BudgetCategoryState.delete)
		.toBeCalledWith(id);
	expect(BudgetMonthState.read)
		.toBeCalledWith(`${AuthHouseholdState.data()[0].id}`);
	testing.click("#button-cancel");
	testing.click("#button-update");
	await testing.sleep(100);
	expect(BudgetCategoryState.update)
		.toBeCalledTimes(1);
	expect(BudgetMonthState.read)
		.toBeCalledTimes(2);
	budgetCategory.id = null;
	testing.redraw();
	testing.click("#button-add");
	await testing.sleep(100);
	expect(BudgetCategoryState.create)
		.toBeCalledTimes(1);
	expect(BudgetMonthState.read)
		.toBeCalledTimes(3);
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	testing.redraw();

	budgetCategory.budgetCategory.targetAmount = 5000;
	testing.click("#button-budget-target-amount");
	expect(budgetCategory.amount)
		.toBe(5000);
	budgetCategory.balance = -4000;
	testing.click("#button-budget-to-zero");
	expect(budgetCategory.amount)
		.toBe(9000);
	expect(budgetCategory.balance)
		.toBe(0);

	budgetCategory.amount = 0;
	budgetCategory.balance = 0;
	budgetCategory.budgetCategoryID = id;
	budgetCategory.budgetCategory.targetAmount = 0;

	testing.find("#form-item-owner");

	testing.input("#form-item-input-name", "Name");
	expect(budgetCategory.budgetCategory.name)
		.toBe("Name");

	testing.input("#form-item-input-grouping", "Grouping");
	expect(budgetCategory.budgetCategory.grouping)
		.toBe("Grouping");

	testing.click("#form-checkbox-input-income");
	expect(budgetCategory.budgetCategory.income)
		.toBeTruthy();
	testing.notFind("#form-item-input-budgeted");
	testing.click("#form-checkbox-input-income");

	testing.input("#form-item-input-budgeted", "$3.00");
	expect(budgetCategory.amount)
		.toBe(300);

	testing.click("#button-array-target-type-monthly");

	testing.input("#form-item-input-target-amount", "$3.00");
	expect(budgetCategory.budgetCategory.targetAmount)
		.toBe(300);

	testing.notFind("#form-item-input-target-month");
	testing.notFind("#form-item-input-target-date");
	testing.click("#button-array-target-type-yearly");
	testing.find("#form-item-select-target-month");
	testing.click("#button-array-target-type-date");
	testing.find("#form-item-input-target-date");

	testing.text("#form-item-text-area-projects-using-this-budget", "labelTest");
});
