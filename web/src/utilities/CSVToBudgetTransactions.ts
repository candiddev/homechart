import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import { UUID } from "@lib/types/UUID";
import { CSV } from "@lib/utilities/CSV";

import { BudgetPayeeState } from "../states/BudgetPayee";
import type { BudgetTransaction } from "../states/BudgetTransaction";
import { BudgetTransactionState } from "../states/BudgetTransaction";

/* eslint-disable jsdoc/require-jsdoc */
export interface BudgetTransactionFields {
	[key: string]: string,
	"Amount": string,
	"Date": string,
	"Payee": string,
}

export async function CSVToBudgetTransactions (input: string, budgetAccountID: NullUUID, fields: BudgetTransactionFields): Promise<BudgetTransaction[]> {
	const data = await CSV.import(input);

	if (data !== null) {
		return data.data.map((value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
			const transaction = {
				...BudgetTransactionState.new(),
				...{
					accounts: [
						{
							...BudgetTransactionState.newAccount(),
							...{
								budgetAccountID: budgetAccountID,
								status: 1,
							},
						},
					],
					id: UUID.new(),
				},
			};

			if (fields.Payee !== "") {
				transaction.budgetPayeeName = value[fields.Payee];
				transaction.budgetPayeeID = BudgetPayeeState.findName(transaction.budgetPayeeName).id;

				if (transaction.budgetPayeeID === null) {
					for (const payee of BudgetPayeeState.data()) {
						if (transaction.budgetPayeeName.toLowerCase()
							.includes(payee.name.toLowerCase())) {
							transaction.budgetPayeeID = payee.id;
							break;
						}
					}
				}

				if (transaction.budgetPayeeID !== null) {
					transaction.budgetPayeeName = "";
					const categoryID = BudgetPayeeState.findID(transaction.budgetPayeeID).budgetCategoryID;
					if (categoryID !== null) {
						transaction.categories = [
							{
								...BudgetTransactionState.newCategory(),
								...{
									budgetCategoryID: categoryID,
								},
							},
						];
					}
				}
			}

			if (fields.Amount !== "") {
				transaction.amount = Currency.toNumber(value[fields.Amount]);
				transaction.accounts[0].amount = transaction.amount;

				if (transaction.categories !== null && transaction.categories.length === 1) {
					transaction.categories[0].amount = transaction.amount;
				}
			}

			if (fields.Date !== "") {
				transaction.date = CivilDate.fromString(value[fields.Date])
					.toJSON();

				if (transaction.categories !== null && transaction.categories.length === 1) {
					transaction.categories[0].yearMonth = CivilDate.fromString(`${transaction.date}`)
						.toYearMonth()
						.toNumber();
				}
			}

			return transaction;
		});
	}

	return [];
}
