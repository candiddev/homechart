import { YearMonth } from "@lib/types/YearMonth";

import seed from "../jest/seed";
import { BudgetMonthState } from "./BudgetMonth";

describe("BudgetMonthState", () => {
	test("load/set", async () => {
		await BudgetMonthState.set(seed.budgetMonths[0]);

		expect(await BudgetMonthState.load())
			.toStrictEqual(seed.budgetMonths[0]);
	});

	test("read", async () => {
		testing.mocks.responses = [
			{
				dataType: "BudgetMonth",
				dataValue: [
					seed.budgetMonths[0],
				],
			},
		];

		BudgetMonthState.yearMonth = YearMonth.fromNumber(seed.budgetMonths[0].yearMonth);

		await BudgetMonthState.read(seed.authHouseholds[0].id);

		expect(BudgetMonthState.data())
			.toStrictEqual({
				...seed.budgetMonths[0],
				...{
					budgetMonthCategories: BudgetMonthState.data().budgetMonthCategories,
				},
			});

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/budget/months/${seed.authHouseholds[0].id}/${seed.budgetMonths[0].yearMonth}`,
			},
		]);
	});
});
