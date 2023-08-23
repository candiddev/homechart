import seed from "../jest/seed";
import { BudgetCategoryState } from "./BudgetCategory";

describe("BudgetCategoryState", () => {
	test("data", () => {
		BudgetCategoryState.data(seed.budgetCategories);
	});

	test("findHeaderName", async () => {
		expect(BudgetCategoryState.findGroupName(`${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`))
			.toStrictEqual(seed.budgetCategories[1]);
		expect(BudgetCategoryState.findGroupName("Hidden > Starting Balance"))
			.toStrictEqual(seed.budgetCategories[0]);
	});

	test("findIDHeaderName", async () => {
		expect(BudgetCategoryState.findIDHeaderName(seed.budgetCategories[0].id))
			.toBe(`Hidden > ${seed.budgetCategories[0].name}`);
		expect(BudgetCategoryState.findIDHeaderName(seed.budgetCategories[1].id))
			.toBe(`${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`);
		expect(BudgetCategoryState.data()[0].grouping)
			.toBe("");
	});

	test("groupingNames", () => {
		expect(BudgetCategoryState.groupingNames())
			.toStrictEqual([
				"Bills",
				"Food",
				"Home",
				"Income",
				"Savings",
			]);
	});

	test("names", async () => {
		expect(BudgetCategoryState.names())
			.toStrictEqual([
				"Bills > Mortgage/Rent",
				"Bills > Utilities",
				"Food > Groceries",
				"Food > Pistachios",
				"Food > Restaurants",
				"Home > Cleaning",
				"Home > Clothing",
				"Home > Electronics",
				"Home > Household Goods",
				"Income > Jane's General Store",
				"Income > Salary",
				"Savings > Emergency Fund",
				"Savings > Vacation",
				"Hidden > Fun Fund",
				"Hidden > Starting Balance",
			]);
	});
});
