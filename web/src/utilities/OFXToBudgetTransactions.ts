import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import { BudgetPayeeState } from "../states/BudgetPayee";
import type { BudgetTransaction } from "../states/BudgetTransaction";
import { BudgetTransactionState } from "../states/BudgetTransaction";

interface OFX {
	OFX: {
		BANKMSGSRSV1?: {
			STMTTRNRS: {
				STMTRS: OFXTransactions[],
			}[],
		}[],
		CREDITCARDMSGSRSV1?: {
			CCSTMTTRNRS: {
				CCSTMTRS: OFXTransactions[],
			}[],
		}[],
	},
}

interface OFXTransactions {
	BANKTRANLIST: {
		STMTTRN: OFXTransaction[],
	}[],
}

interface OFXTransaction {
	DTPOSTED: string[],
	MEMO?: string[],
	NAME?: string[],
	TRNAMT: string[],
}

function parseTransaction (ofx: OFXTransaction, budgetAccountID: NullUUID): BudgetTransaction {
	const amount = parseInt(ofx.TRNAMT[0].replace(/\./, ""), 10);
	const transaction = {
		...BudgetTransactionState.new(),
		...{
			accounts: [
				{
					...BudgetTransactionState.newAccount(),
					...{
						amount: amount,
						budgetAccountID: budgetAccountID,
						status: 1,
					},
				},
			],
			amount: amount,
			date: ofx.DTPOSTED[0].replace(/(\d{4})(\d{2})(\d{2}).*/, "$1-$2-$3"),
			id: UUID.new(),
		},
	};
	if (ofx.NAME !== undefined) {
		transaction.budgetPayeeName = ofx.NAME[0];
	}
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
						amount: amount,
						budgetCategoryID: categoryID,
						yearMonth: CivilDate.fromString(transaction.date)
							.toYearMonth()
							.toNumber(),
					},
				},
			];
		}
	}
	return transaction;
}

export async function OFXToBudgetTransactions (data: string, budgetAccountID: NullUUID): Promise<BudgetTransaction[]> {
	const xml2js = await import("xml2js");

	const transactions: BudgetTransaction[] = [];
	const dataString = data.split("<OFX>", 2)[1];
	const dataXML = dataString.replace(/>\s+</g, "><")    // remove whitespace inbetween tag close/open
		.replace(/\s+</g, "<")      // remove whitespace before a close tag
		.replace(/>\s+/g, ">")      // remove whitespace after a close tag
		.replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)/g, "<$1$2>$3")
		.replace(/<(\w+?)>([^<]+)/g, "<$1>$2</$1>");
	const xmlString = `<OFX> ${dataXML}`;
	xml2js.parseString(xmlString, (_err: string, result: OFX) => {
		if (result.OFX.BANKMSGSRSV1 !== undefined) {
			for (const transaction of result.OFX.BANKMSGSRSV1[0].STMTTRNRS[0].STMTRS[0].BANKTRANLIST[0].STMTTRN) {
				transactions.push(parseTransaction(transaction, budgetAccountID));
			}
		} else if (result.OFX.CREDITCARDMSGSRSV1 !== undefined) {
			for (const transaction of result.OFX.CREDITCARDMSGSRSV1[0].CCSTMTTRNRS[0].CCSTMTRS[0].BANKTRANLIST[0].STMTTRN) {
				transactions.push(parseTransaction(transaction, budgetAccountID));
			}
		}
	});
	return transactions;
}
