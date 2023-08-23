import { CivilDate } from "@lib/types/CivilDate";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { ChartDatasetTypesEnum } from "../states/ChartDataset";
import { BudgetCharts } from "./BudgetCharts";

beforeEach(() => {
	AuthAccountState.readLock = true;
	testing.mocks.responses = [
		{
			dataType: "ChartDatasets",
			dataValue: [
				{
					name: "test",
					values: [
						{
							name: "a",
							value: 1,
						},
						{
							name: "b",
							value: 2,
						},
						{
							name: "c",
							value: 3,
						},
					],
				},
			],
		},
	];
});

describe("BudgetCharts", () => {
	const today = CivilDate.now()
		.toYearMonth();

	Object.defineProperty(window, "getComputedStyle", {
		value: () => {
			return {
				getPropertyValue: () => {
					return "0, 0, 0";
				},
			};
		},
	});

	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	BudgetCategoryState.refreshed = true;
	BudgetPayeeState.refreshed = true;

	test("categories", async () => {
		testing.mocks.params = {
			type: "categories",
		};

		testing.mount(BudgetCharts);
		await testing.sleep(100);

		testing.hasClass("#tab-doe-family", "Title__tab--active");

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/charts/datasets/${seed.authHouseholds[0].id}/${ChartDatasetTypesEnum.BudgetCategory}?from=${today.toNumber()}&to=${today.toNumber()}`,
			},
		]);

		testing.title("Budget - Charts");
		testing.hasClass("#tab-spending-by-category", "Title__tab--active");

		// Table
		testing.text("#table-data-test-name", "test");
		testing.text("#table-data-test-value", " $0.01");

		// Dates
		testing.text(".BudgetCharts__date-ranges", "This MonthLast Three MonthsYear to DateCustomUse Groupings");
		testing.notFind("#form-item-input-date-range-from");
		testing.notFind("#form-item-input-date-range-to");
		testing.click("#button-custom");
		testing.find("#form-item-input-date-range-from");
		testing.find("#form-item-input-date-range-to");
		const lastMonth = today.addMonths(-1);
		testing.mocks.responses = [
			{
				dataType: "ChartDatasets",
				dataValue: [],
			},
		];
		testing.input("#form-item-input-date-range-from", lastMonth.toValue());

		await testing.sleep(100);

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/charts/datasets/${seed.authHouseholds[0].id}/${ChartDatasetTypesEnum.BudgetCategory}?from=${lastMonth.toNumber()}&to=${today.toNumber()}`,
			},
		]);
	});

	test("income-expense", async () => {
		testing.mocks.params = {
			type: "income-expense",
		};

		testing.mount(BudgetCharts);
		await testing.sleep(100);

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/charts/datasets/${seed.authHouseholds[0].id}/${ChartDatasetTypesEnum.BudgetIncomeExpense}?from=${today.toNumber()}&to=${today.toNumber()}`,
			},
		]);

		testing.title("Budget - Charts");
		testing.hasClass("#tab-income---expense", "Title__tab--active");
	});

	test("payees", async () => {
		testing.mocks.params = {
			type: "payees",
		};

		testing.mount(BudgetCharts);
		await testing.sleep(100);

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/charts/datasets/${seed.authHouseholds[0].id}/${ChartDatasetTypesEnum.BudgetPayee}?from=${today.toNumber()}&to=${today.toNumber()}`,
			},
		]);

		testing.title("Budget - Charts");
		testing.hasClass("#tab-spending-by-payee", "Title__tab--active");
	});
});
