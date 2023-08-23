import seed from "../jest/seed";
import { BudgetPayeeState } from "./BudgetPayee";

describe("BudgetPayeeState", () => {
	test("data", () => {
		BudgetPayeeState.data(seed.budgetPayees);
		BudgetPayeeState.data([]);
	});

	test("storeNames", () => {
		BudgetPayeeState.data([
			{
				...BudgetPayeeState.new(),
				...{
					name: "a",
					shopStore: true,
				},
			},
			{
				...BudgetPayeeState.new(),
				...{
					name: "b",
				},
			},
			{
				...BudgetPayeeState.new(),
				...{
					name: "c",
					shopStore: true,
				},
			},
		]);
		expect(BudgetPayeeState.storeNames())
			.toStrictEqual([
				"a",
				"c",
			]);
	});
});
