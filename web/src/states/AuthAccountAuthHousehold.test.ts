import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import { AuthAccountAuthHouseholdState } from "./AuthAccountAuthHousehold";
import { BudgetAccountState } from "./BudgetAccount";

describe("AuthAccountAuthHousehold", () => {
  AuthAccountState.data(seed.authAccounts[0]);

  test("delete", async () => {
    BudgetAccountState.refreshed = true;

    testing.mocks.responses = [
      {},
      {
        dataType: "AuthSession",
        dataValue: [seed.authSessions[0]],
      },
    ];

    await AuthAccountAuthHouseholdState.delete("1", seed.authAccounts[0].id);

    expect(BudgetAccountState.refreshed).toBeFalsy();
    testing.requests([
      {
        method: "DELETE",
        path: `/api/v1/auth/households/1/members/${seed.authAccounts[0].id}`,
      },
    ]);
  });
  test("inviteAccept", async () => {
    BudgetAccountState.refreshed = true;

    testing.mocks.responses = [
      {},
      {
        dataType: "AuthAccount",
        dataValue: [seed.authAccounts[0]],
      },
      {
        dataType: "AuthSession",
        dataValue: [seed.authSessions[0]],
      },
      {
        dataType: "AuthHousehold",
        dataValue: [seed.authHouseholds[0]],
      },
    ];

    await AuthAccountAuthHouseholdState.inviteAccept("1");
    await testing.sleep(100);

    expect(BudgetAccountState.refreshed).toBeFalsy();

    testing.requests([
      {
        method: "GET",
        path: `/api/v1/auth/households/${AuthAccountState.data().id}/invites/1`,
      },
      {
        method: "GET",
        path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
        updated: seed.authAccounts[0].updated,
      },
      {
        method: "GET",
        path: `/api/v1/auth/households/${seed.authHouseholds[0].id}`,
      },
    ]);
  });
  test("inviteCreate", async () => {
    testing.mocks.responses = [{}];

    const a = {
      ...AuthAccountAuthHouseholdState.new(),
      ...{
        authHouseholdID: "1",
        name: "test",
      },
    };

    await AuthAccountAuthHouseholdState.inviteCreate(a);

    testing.requests([
      {
        body: a,
        method: "POST",
        path: "/api/v1/auth/households/1/invites",
      },
    ]);
  });
  test("update", async () => {
    const a = {
      ...AuthAccountAuthHouseholdState.new(),
      ...{
        authHouseholdID: "1",
        id: "2",
        name: "test",
      },
    };

    testing.mocks.responses = [{}];

    await AuthAccountAuthHouseholdState.update(a);

    testing.requests([
      {
        body: a,
        method: "PUT",
        path: "/api/v1/auth/households/1/members/2",
      },
    ]);
  });
});
