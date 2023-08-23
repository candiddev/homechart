import seed from "../jest/seed";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { OFXToBudgetTransactions } from "./OFXToBudgetTransactions";

test("OFXToBudgetTransactions", async () => {
	BudgetCategoryState.data(seed.budgetCategories);
	BudgetPayeeState.data(seed.budgetPayees);
	const input = `

OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20191130120000[0:GMT]
<LANGUAGE>ENG
<FI>
<ORG>B1
<FID>10898
</FI>
<INTU.BID>10898
</SONRS>
</SIGNONMSGSRSV1>
<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
<MESSAGE>Success
</STATUS>
<CCSTMTRS>
<CURDEF>USD
<CCACCTFROM>
<ACCTID>11112222
</CCACCTFROM>
<BANKTRANLIST>
<DTSTART>20191130120000[0:GMT]
<DTEND>20191130120000[0:GMT]
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20191129120000[0:GMT]
<TRNAMT>-20.20
<FITID>2019112924164079332691009830630
<NAME>${seed.budgetPayees[0].name.toUpperCase()} SUPER STORE**
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20191128120000[0:GMT]
<TRNAMT>-38.19
<FITID>2019112824164079331730000129039
<NAME>Pet Store 1
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20191128120000[0:GMT]
<TRNAMT>-18.80
<FITID>2019112824013399331003819556775
<NAME>Restaurant 1
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20191128120000[0:GMT]
<TRNAMT>-42.76
<FITID>2019112824692169331100147033033
<NAME>Cellphone provider
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>-100.86
<DTASOF>20191130120000[0:GMT]
</LEDGERBAL>
<AVAILBAL>
<BALAMT>500.60
<DTASOF>20191130120000[0:GMT]
</AVAILBAL>
</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>
</OFX>
`;
	const output = await OFXToBudgetTransactions(input, seed.budgetAccounts[0].id);
	expect(output)
		.toHaveLength(4);
	output[0].id = null;
	expect(output[0])
		.toStrictEqual({
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
							yearMonth: 201911,
						},
					},
				],
				date: "2019-11-29",
			} });
});
