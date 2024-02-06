import seed from "../jest/seed";
import { BudgetAccountState } from "./BudgetAccount";

describe("BudgetAccountState", () => {
  test("data", () => {
    BudgetAccountState.data(seed.budgetAccounts);
    BudgetAccountState.data([]);
  });

  test("reconcile", async () => {
    testing.mocks.responses = [{}];

    await BudgetAccountState.reconcile("1");

    testing.requests([
      {
        method: "POST",
        path: "/api/v1/budget/accounts/1/reconcile",
      },
    ]);
  });
});
