import { App } from "@lib/layout/App";
import { Currency } from "@lib/types/Currency";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetPayees } from "./BudgetPayees";

test("BudgetPayees", async () => {
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetCategoryState.data(seed.budgetCategories);
  BudgetPayeeState.data(seed.budgetPayees);
  testing.mount(App, routeOptions, BudgetPayees);
  testing.title("Budget - Payees");
  testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
  testing.findAll("tbody tr", 6);
  testing.text(
    `#table-data-${seed.budgetPayees[1].id}-name`,
    seed.budgetPayees[1].name,
  );
  testing.text(
    `#table-data-${seed.budgetPayees[1].id}-budgettransactionamount`,
    Currency.toString(
      seed.budgetPayees[1].budgetTransactionAmount,
      AuthHouseholdState.data()[0].preferences.currency,
    ),
  );
  testing.click(`#table-row_${seed.budgetPayees[1].id}`);
  testing.input("#form-item-input-name", "111");
  testing.click("#button-delete");
  testing.mocks.responses.push({});
  testing.click("#button-confirm-delete");
  await testing.sleep(100);
  BudgetPayeeState.data(seed.budgetPayees.slice(1, 3));
  await testing.sleep(100);
  testing.redraw();
  testing.notFind("#button-cancel");
  testing.findAll("tbody tr", 2);
});
