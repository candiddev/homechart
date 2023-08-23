import { App } from "@lib/layout/App";
import { Timestamp } from "@lib/types/Timestamp";
import { StringToID } from "@lib/utilities/StringToID";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { PlanProjectState } from "../states/PlanProject";
import { BudgetCategories } from "./BudgetCategories";

test("BudgetCategories", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	const current = Timestamp.now()
		.toCivilDate()
		.toYearMonth();
	let year = current.addMonths(0);
	let previous = year.addMonths(-1);
	const next = year.addMonths(1);

	BudgetCategoryState.data(seed.budgetCategories);
	PlanProjectState.data(seed.planProjects);

	testing.mocks.params.yearMonth = year.toNumber();
	testing.mocks.responses = [
		{
			dataType: "BudgetMonth",
			dataValue: [
				{
					...seed.budgetMonths[0],
					...{
						yearMonth: year.toNumber(),
					},
				},
			],
		},
	];

	testing.mount(App, routeOptions, BudgetCategories);

	testing.title("Budget - Categories");
	testing.hasClass("#tab-doe-family", "Title__tab--active");

	testing.find(`#button${StringToID(previous.toString())}`);
	testing.find(`#button${StringToID(next.toString())}`);
	testing.find("#button-budget-target-amount");
	await testing.sleep(200);
	testing.text("#subtitle-carryover", "Carryover: $0.00");
	testing.text("#subtitle-income", "Income: $1,000.00");
	testing.text("#subtitle-budgeted", "Budgeted:-$600.00");
	testing.text("#subtitle-remaining", "Remaining: $400.00");
	testing.findAll("tbody tr", 19);
	testing.text("#table-data-home-budgetcategoryname", "Homeexpand_less");
	testing.text("#table-data-home-amount", " $300.00");
	testing.notFind("#button-update-category");
	testing.click("#table-row_billsmortgage-rent");
	testing.find("#form-item-input-name");
	testing.find("#form-item-input-grouping");
	testing.find("#form-item-input-budgeted");
	const type = testing.find("#button-array-target-type");

	testing.notFind("#form-item-input-target-month");
	testing.notFind("#form-item-input-target-date");
	testing.click(`#${type.id} p:nth-of-type(2)`);
	await testing.sleep(100);
	testing.find("#form-item-owner");
	testing.find("#form-item-input-target-amount");
	testing.find("#form-item-select-target-month");
	testing.click(`#${type.id} p:nth-of-type(3)`);
	await testing.sleep(100);
	testing.find("#form-item-input-target-date");
	testing.click("#form-checkbox-input-income");
	await testing.sleep(100);
	testing.notFind("#form-item-input-budgeted");
	testing.notFind("#form-item-select-target-type");
	testing.find("#button-update");
	testing.click("#button-cancel");
	testing.text("#table-data-foodpistachios-budgetcategoryname", "Pistachios");
	testing.text("#table-data-foodpistachios-amount", " $300.00");
	testing.text("#table-data-foodpistachios-balance", " $250.00");
	testing.text("#table-data-foodpistachios-budgetcategorytargetamount", " $4,000.00");

	testing.text("#table-data-income-budgetcategoryname", "Incomeexpand_less");
	testing.text("#table-data-income-amount", "");
	testing.text("#table-data-income-budgettransactionamount", " $1,000.00");
	testing.text("#table-data-income-balance", "");
	testing.text("#table-data-income-budgetcategorytargetamount", "");

	const hidden = testing.find("#table-data-hidden-budgetcategoryname");
	testing.text(hidden, "Hiddenexpand_less");
	testing.click(`#${hidden.id} i`);
	testing.text("#table-data-hidden-budgetcategoryname", "Hiddenexpand_less");
	testing.text("#table-data-hiddenfun-fund-budgetcategoryname", "Fun Fund");
	testing.click(`#${hidden.id} i`);

	// next month
	year = year.addMonths(1);
	testing.mocks.params.yearMonth = year;
	testing.mocks.responses = [
		{
			dataType: "BudgetCategories",
			dataValue: [
				seed.budgetCategories,
			],
		},
		{
			dataType: "BudgetMonth",
			dataValue: [
				{
					...seed.budgetMonths[0],
					...{
						yearMonth: year.toNumber(),
					},
				},
			],
		},
	];
	testing.click(`#button${StringToID(next.toString())}`);
	await testing.sleep(100);

	testing.text("#subtitle-remaining", "Remaining: $400.00");
	testing.findAll("tbody tr", 19);

	// previous month
	year = year.addMonths(-2);
	testing.mocks.params.yearMonth = year;
	testing.mocks.responses = [
		{
			dataType: "BudgetCategories",
			dataValue: [
				seed.budgetCategories,
			],
		},
		{
			dataType: "BudgetMonth",
			dataValue: [
				{
					...seed.budgetMonths[0],
					...{
						yearMonth: year.addMonths(1)
							.toNumber(),
					},
				},
			],
		},
		{
			dataType: "BudgetCategories",
			dataValue: [
				seed.budgetCategories,
			],
		},
		{
			dataType: "BudgetMonth",
			dataValue: [
				{
					...seed.budgetMonths[0],
					...{
						yearMonth: year.toNumber(),
					},
				},
			],
		},
	];
	previous = previous.addMonths(2);
	testing.click(`#button${StringToID(previous.toString())}`);
	await testing.sleep(100);
	previous = previous.addMonths(-2);
	testing.click(`#button${StringToID(previous.toString())}`);
	await testing.sleep(100);

	testing.text("#subtitle-remaining", "Remaining: $400.00");
	testing.findAll("tbody tr", 19);
});
