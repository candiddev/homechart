import seed from "../jest/seed";
import { BudgetTransactionState } from "./BudgetTransaction";

describe("BudgetTransactionState", () => {
	test("create", async () => {
		testing.mocks.responses = [
			{},
		];

		await BudgetTransactionState.create(seed.budgetTransactions[0]);

		testing.requests([
			{
				body: seed.budgetTransactions[0],
				method: "POST",
				path: "/api/v1/budget/transactions",
			},
		]);
	});

	test("load/set", async () => {
		await BudgetTransactionState.set(seed.budgetTransactions);

		const transactions = await BudgetTransactionState.load();

		expect(transactions)
			.toStrictEqual(seed.budgetTransactions);
	});

	test("read", async () => {
		const spy = vi.spyOn(BudgetTransactionState, "loaded", "set");

		await BudgetTransactionState.read();

		expect(spy)
			.toHaveBeenCalledTimes(2);

		await BudgetTransactionState.read(true);

		expect(spy)
			.toHaveBeenCalledTimes(3);
	});

	test("readAccount", async () => {
		testing.mocks.responses = [
			{
				dataType: "BudgetTransactions",
				dataValue: [
					BudgetTransactionState.new(),
					BudgetTransactionState.new(),
				],
			},
		];

		BudgetTransactionState.offset = 50;
		await BudgetTransactionState.readAccount("1");
		expect(BudgetTransactionState.data())
			.toHaveLength(2);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/budget/accounts/1/transactions?offset=50",
			},
		]);
	});

	test("readCategory", async () => {
		testing.mocks.responses = [
			{
				dataType: "BudgetTransactions",
				dataValue: [
					BudgetTransactionState.new(),
				],
			},
		];

		BudgetTransactionState.offset = 50;
		await BudgetTransactionState.readCategory("1");
		expect(BudgetTransactionState.data())
			.toHaveLength(1);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/budget/categories/1/transactions?offset=50",
			},
		]);
	});

	test("readCategoryMonth", async () => {
		testing.mocks.responses = [
			{
				dataType: "BudgetTransactions",
				dataValue: [
					BudgetTransactionState.new(),
					BudgetTransactionState.new(),
				],
			},
		];

		BudgetTransactionState.offset = 50;
		await BudgetTransactionState.readCategoryMonth("1", 202006);
		expect(BudgetTransactionState.data())
			.toHaveLength(2);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/budget/categories/1/transactions/202006?offset=50",
			},
		]);
	});

	test("readPayee", async () => {
		testing.mocks.responses = [
			{
				dataType: "BudgetTransactions",
				dataValue: [
					BudgetTransactionState.new(),
				],
			},
		];

		BudgetTransactionState.offset = 50;
		await BudgetTransactionState.readPayee("1");
		expect(BudgetTransactionState.data())
			.toHaveLength(1);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/budget/payees/1/transactions?offset=50",
			},
		]);
	});

	test("update", async () => {
		testing.mocks.responses = [
			{},
		];

		await BudgetTransactionState.update(seed.budgetTransactions[0]);

		testing.requests([
			{
				body: seed.budgetTransactions[0],
				method: "PUT",
				path: `/api/v1/budget/transactions/${seed.budgetTransactions[0].id}`,
			},
		]);
	});
});
