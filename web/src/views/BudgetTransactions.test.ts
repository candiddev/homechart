import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import type { BudgetTransaction } from "../states/BudgetTransaction";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { BudgetTransactionAccountStatusEnum } from "../types/BudgetTransactionAccountStatus";
import { BudgetTransactions } from "./BudgetTransactions";

const transaction = {
  ...seed.budgetTransactions[0],
  ...{
    accounts: [
      {
        ...seed.budgetTransactions[0].accounts[0],
        ...{
          status: BudgetTransactionAccountStatusEnum.Cleared,
        },
      },
    ],
    date: CivilDate.now().toJSON(),
  },
};

const account = {
  ...BudgetAccountState.new(),
  ...{
    budgetTransactionAmount: 3000,
    budgetTransactionAmountCleared: 1000,
    budgetTransactionAmountReconciled: 2000,
    id: transaction.accounts[0].budgetAccountID,
    name: "Store",
    shortID: "1",
  },
};

beforeEach(() => {
  BudgetAccountState.data([account]);
  BudgetCategoryState.data(seed.budgetCategories);
  BudgetPayeeState.data(seed.budgetPayees);
  BudgetRecurrenceState.data(seed.budgetRecurrences);
});

describe("BudgetTransactions", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);

  test("renders OK", async () => {
    const transactions: BudgetTransaction[] = Array(50).fill(transaction);

    testing.mocks.responses = [
      {
        dataTotal: 75,
        dataType: "BudgetTransactions",
        dataValue: transactions,
      },
    ];
    testing.mocks.params.account = transaction.accounts[0].budgetAccountID;
    testing.mount(App, routeOptions, BudgetTransactions);
    await testing.sleep(500);
    testing.find("#button-reconcile");
    testing.title("Budget - Accounts - Store");
    testing.find("#tab-all-transactions");
    testing.text("#tab-recurring-transactions", "Recurring Transactions2");
    testing.find("#button-next");
    testing.notFind("#button-previous");

    // Test recurrence
    testing.mocks.responses = [
      {
        dataTotal: 75,
        dataType: "BudgetTransactions",
        dataValue: transactions,
      },
    ];
    testing.mocks.params.recurring = true;
    testing.mount(App, routeOptions, BudgetTransactions);
    await testing.sleep(500);
    testing.find("#table-transactions");
    testing.findAll("tbody tr", seed.budgetRecurrences.length - 1);
    testing.text(
      `#table-data-${seed.budgetRecurrences[0].id}-nextdate`,
      `${AppState.formatCivilDate(seed.budgetRecurrences[0].template.date)}AddSkip`,
    );
    testing.text(
      `#table-data-${seed.budgetRecurrences[0].id}-payee`,
      seed.budgetPayees[1].name,
    );
    testing.text(
      `#table-data-${seed.budgetRecurrences[0].id}-category`,
      `Income > ${seed.budgetPayees[1].name}`,
    );
    testing.text(
      `#table-data-${seed.budgetRecurrences[0].id}-amount`,
      Currency.toString(
        seed.budgetRecurrences[0].template.accounts[0].amount,
        AuthHouseholdState.data()[0].preferences.currency,
      ),
    );
    testing.notFind("#button-cancel");
    testing.click(`#table-transactions-row_${seed.budgetRecurrences[0].id}`);
    await testing.sleep(100);
    testing.value(
      "#form-item-input-date",
      seed.budgetRecurrences[0].template.date,
    );
    testing.value("#form-item-select-account", account.id);
    testing.click("#button-cancel");
    await testing.sleep(100);

    // Test transactionTable
    testing.mocks.responses = [
      {
        dataTotal: 75,
        dataType: "BudgetTransactions",
        dataValue: transactions,
      },
    ];
    testing.mocks.params = {
      account: transaction.accounts[0].budgetAccountID,
    };
    testing.mount(App, routeOptions, BudgetTransactions);
    await testing.sleep(500);
    testing.text(
      "#subtitle-total",
      `Total:${Currency.toString(account.budgetTransactionAmount, AuthHouseholdState.data()[0].preferences.currency)}`,
    );
    testing.text(
      "#subtitle-cleared",
      `Cleared:${Currency.toString(account.budgetTransactionAmountCleared, AuthHouseholdState.data()[0].preferences.currency)}`,
    );
    testing.text(
      "#subtitle-reconciled",
      `Reconciled:${Currency.toString(account.budgetTransactionAmountReconciled, AuthHouseholdState.data()[0].preferences.currency)}`,
    );
    testing.find("#table-transactions");
    testing.findAll("tbody tr", 50);
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-date`,
      AppState.formatCivilDate(transaction.date),
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-payee`,
      BudgetPayeeState.findID(seed.budgetTransactions[0].budgetPayeeID).name,
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-category`,
      BudgetCategoryState.findIDHeaderName(
        seed.budgetTransactions[0].categories[0].budgetCategoryID,
      ),
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-cleared`,
      "check_box",
    );
    testing.mocks.requests = [];
    testing.mocks.responses = [
      {},
      {
        dataType: "BudgetTransactions",
        dataValue: transactions,
      },
    ];
    testing.click(`#table-data-${seed.budgetTransactions[0].id}-cleared`);
    await testing.sleep(100);
    expect(testing.mocks.requests).not.toBe([]);
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-reconciled`,
      "check_box_outline_blank",
    );
    testing.mocks.requests = [];
    account.budgetTransactionAmountCleared = 0;
    account.budgetTransactionAmountReconciled = 3000;
    BudgetAccountState.data([account]);
    testing.mocks.responses = [
      {},
      {
        dataType: "BudgetTransactions",
        dataValue: transactions,
      },
    ];
    testing.click(`#table-data-${seed.budgetTransactions[0].id}-reconciled`);
    await testing.sleep(100);
    expect(testing.mocks.requests).not.toBe([]);
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-amount`,
      Currency.toString(
        seed.budgetTransactions[0].accounts[0].amount,
        AuthHouseholdState.data()[0].preferences.currency,
      ),
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-balance`,
      Currency.toString(
        seed.budgetTransactions[0].balance,
        AuthHouseholdState.data()[0].preferences.currency,
      ),
    );
    testing.notFind("#button-cancel");
    testing.click(`#table-transactions-row_${seed.budgetTransactions[0].id}`);
    testing.click("#button-cancel");
    await testing.sleep(100);
    testing.click("#button-import-transactions");
    testing.find("#button-select-csv");
    testing.find("#button-select-ofx-qfx");
  });

  test("render import", async () => {
    const transactions: BudgetTransaction[] = Array(75).fill(
      seed.budgetTransactions[0],
    );

    BudgetTransactionState.data(transactions);

    testing.mocks.params = {
      import: seed.budgetAccounts[0].id,
    };

    testing.mount(App, routeOptions, BudgetTransactions);
    testing.title("Budget - Accounts - Store");
    testing.find("#button-import-transactions");
    testing.notFind("#button-reconcile");

    // Test transactionTable
    testing.notFind("#form-subtitle-total:");
    testing.find("#table-transactions");
    testing.findAll("tbody tr", 75);
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-date`,
      AppState.formatCivilDate(seed.budgetTransactions[0].date),
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-payee`,
      BudgetPayeeState.findID(seed.budgetTransactions[0].budgetPayeeID).name,
    );
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-category`,
      BudgetCategoryState.findIDHeaderName(
        seed.budgetTransactions[0].categories[0].budgetCategoryID,
      ),
    );
    testing.notFind("#form-checkbox-input-table-data-0-cleared");
    testing.notFind("#form-checkbox-input-table-data-0-reconciled");
    testing.text(
      `#table-data-${seed.budgetTransactions[0].id}-amount`,
      Currency.toString(
        seed.budgetTransactions[0].accounts[0].amount,
        AuthHouseholdState.data()[0].preferences.currency,
      ),
    );
    testing.notFind("#table-data-0-balance");
  });
});
