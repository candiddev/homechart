import { Icons } from "@lib/types/Icons";

import seed from "../jest/seed";
import { BudgetAccountState } from "../states/BudgetAccount";
import { AppSearcher } from "./AppSearcher";

test("AppSearcher", () => {
	BudgetAccountState.data(seed.budgetAccounts);

	expect(AppSearcher(seed.budgetAccounts[1].name))
		.toStrictEqual([
			{
				href: `/budget/account/${seed.budgetAccounts[1].id}`,
				icon: Icons.BudgetAccount,
				name: seed.budgetAccounts[1].name,
				permitted: true,
				requireOnline: false,
			},
		]);
});
