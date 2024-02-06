import { App } from "@lib/layout/App";
import { Currency } from "@lib/types/Currency";
import { Icons } from "@lib/types/Icons";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetAccounts } from "./BudgetAccounts";

test("BudgetAccounts", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetAccountState.data(seed.budgetAccounts.slice(0, 2));

  testing.mount(App, routeOptions, BudgetAccounts);
  testing.title("Budget - Accounts");
  testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
  testing.findAll("tbody tr", 2);
  testing.text(
    `#table-data-${seed.budgetAccounts[0].id}-name`,
    seed.budgetAccounts[0].name,
  );
  testing.text(
    `#table-data-${seed.budgetAccounts[0].id}-budgettransactionamount`,
    Currency.toString(
      seed.budgetAccounts[0].budgetTransactionAmount,
      AuthHouseholdState.data()[0].preferences.currency,
    ),
  );
  testing.text(
    `#table-data-${seed.budgetAccounts[0].id}-budget`,
    Icons.CheckYes,
  );
  testing.click(`#table-row_${seed.budgetAccounts[0].id}`);
  testing.click("#form-checkbox-label-hidden");
});
