import seed from "../jest/seed";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { CSVToBudgetTransactions } from "./CSVToBudgetTransactions";


test("CSVToBudgetTransactions", async () => {
	BudgetCategoryState.data(seed.budgetCategories);
	BudgetPayeeState.data(seed.budgetPayees);
	const input = `
Account Type: Checking
Account Number: 123456
Date Range: 4/1/2022 - 4/10/2022

Transaction Type,Date,Description,Memo,Amount,Balance,Check Number
Other,4/5/2022,Debit Card,${seed.budgetPayees[0].name.toUpperCase()},-20.20,880.05,
Other,2022-04-03,Debit Card,Pet Store 1,-38.19,900.25,
Other,2022-04-02,Debit Card,Restaurant 1,-18.80,938.44,
Other,4/1/2022,Debit Card,Cellphone provider,-42.76,957.24,
`;


	const output = (await CSVToBudgetTransactions(input, seed.budgetAccounts[0].id, {
		"Amount": "Amount",
		"Check Number": "Check Number",
		"Date": "Date",
		"Payee": "Memo",
	})).slice(0, 2);
	output[0].id = null;
	output[1].id = null;

	expect(output)
		.toStrictEqual([
			{
				...BudgetTransactionState.new(),
				...{
					accounts: [
						{ ...BudgetTransactionState.newAccount(),
							...{
								amount: -2020,
								budgetAccountID: seed.budgetAccounts[0].id,
								status: 1,
							},
						},
					],
					amount: -2020,
					budgetPayeeID: seed.budgetPayees[0].id,
					categories: [
						{
							...BudgetTransactionState.newCategory(),
							...{
								amount: -2020,
								budgetCategoryID: seed.budgetPayees[0].budgetCategoryID,
								yearMonth: 202204,
							},
						},
					],
					date: "2022-04-05",
				},
			},
			{
				...BudgetTransactionState.new(),
				...{
					accounts: [
						{ ...BudgetTransactionState.newAccount(),
							...{
								amount: -3819,
								budgetAccountID: seed.budgetAccounts[0].id,
								status: 1,
							},
						},
					],
					amount: -3819,
					budgetPayeeID: seed.budgetPayees[5].id,
					date: "2022-04-03",
				},
			},
		]);
});
