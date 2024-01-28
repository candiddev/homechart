import seed from "../jest/seed";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { BudgetCategoryState } from "./BudgetCategory";
import type { BudgetMonth } from "./BudgetMonth";
import { BudgetMonthCategoryState } from "./BudgetMonthCategory";

describe("BudgetMonthCategoryState", () => {
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);

	testing.mocks.responses = [
		{
			dataType: "BudgetMonthCategory",
			dataValue: [],
		},
		{
			dataType: "BudgetMonthCategory",
			dataValue: [],
		},
	];

	test("create", async () => {
		await BudgetMonthCategoryState.create(BudgetMonthCategoryState.new());

		testing.requests([
			{
				body: BudgetMonthCategoryState.new(),
				method: "POST",
				path: "/api/v1/budget/month-categories",
			},
		]);
	});

	test("groupingSort", () => {
		const c = seed.budgetMonths[0] as BudgetMonth;
		const output = BudgetMonthCategoryState.groupingSort(c);
		expect(output[7])
			.toStrictEqual({
				amount: 30000,
				authHouseholdID: null,
				balance: 5000,
				budgetCategory: {
					authHouseholdID: null,
					budgetMonthCategoryAmount: 0,
					budgetTransactionAmount: 0,
					created: null,
					grouping: "",
					id: null,
					income: false,
					name: "Home",
					shortID: "",
					targetAmount: 0,
					targetMonth: 0,
					targetYear: 0,
					updated: null,
				},
				budgetCategoryID: null,
				budgetTransactionAmount: -25000,
				created: null,
				id: null,
				targetAmount: 42500,
				yearMonth: 0,
			});

		expect(c.targetAmount)
			.toBe(100000);
		expect(output[12])
			.toStrictEqual({
				...BudgetMonthCategoryState.new(),
				...{
					budgetCategory: {
						...BudgetCategoryState.new(),
						...{
							income: true,
							name: "Income",
						},
					},
					budgetTransactionAmount: 100000,
				},
			});
		expect(output.reverse()[1])
			.toStrictEqual(seed.budgetMonths[0].budgetMonthCategories[0]);
	});

	test("targetAmount", () => {
		expect(
			BudgetMonthCategoryState.targetAmount(
				{
					...BudgetMonthCategoryState.new(),
					...{
						amount: 5000,
						balance: 15000,
						budgetCategory: {
							...BudgetCategoryState.new(),
							...{
								targetAmount: 50000,
							},
						},
					},
				},
				201912,
			),
		)
			.toBe(50000);
		expect(
			BudgetMonthCategoryState.targetAmount(
				{
					...BudgetMonthCategoryState.new(),
					...{
						amount: 5000,
						balance: 15000,
						budgetCategory: {
							...BudgetCategoryState.new(),
							...{
								targetAmount: 50000,
								targetMonth: 12,
							},
						},
					},
				},
				201909,
			),
		)
			.toBe(7500);
		expect(
			BudgetMonthCategoryState.targetAmount(
				{
					...BudgetMonthCategoryState.new(),
					...{
						amount: 5000,
						balance: 15000,
						budgetCategory: {
							...BudgetCategoryState.new(),
							...{
								targetAmount: 60000,
								targetMonth: 5,
								targetYear: 2020,
							},
						},
					},
				},
				201908,
			),
		)
			.toBe(4000);
	});

	test("update", async () => {
		await BudgetMonthCategoryState.update(BudgetMonthCategoryState.new());

		testing.requests([
			{
				body: BudgetMonthCategoryState.new(),
				method: "PUT",
				path: "/api/v1/budget/month-categories",
			},
		]);
	});
});
