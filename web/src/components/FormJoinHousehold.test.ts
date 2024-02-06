import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import type { AuthHousehold } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { FormJoinHousehold } from "./FormJoinHousehold";

test("FormJoinHousehold", async () => {
  AuthAccountState.data({
    ...seed.authAccounts[0],
    ...{
      subscriptionReferrerCode: "testing",
    },
  });
  let household = AuthHouseholdState.new();

  testing.mount(FormJoinHousehold, {
    add: true,
    onjoin: (h: AuthHousehold) => {
      household = h;
    },
  });

  AuthHouseholdState.refreshed = true;

  testing.mocks.responses = [
    {
      dataType: "AuthHousehold",
      dataValue: [seed.authHouseholds[0]],
    },
    {
      dataType: "AuthAccount",
      dataValue: [seed.authAccounts[0]],
    },
    {
      dataType: "AuthSession",
      dataValue: [AuthSessionState.new()],
    },
  ];

  testing.click("#button-add-household");
  await testing.sleep(100);

  expect(AuthHouseholdState.refreshed).toBeFalsy();
  expect(household).toStrictEqual(seed.authHouseholds[0]);

  testing.requests([
    {
      body: {
        ...AuthHouseholdState.new(),
        ...{
          name: "Jane's Household",
          subscriptionReferrerCode: "testing",
        },
      },
      method: "POST",
      path: "/api/v1/auth/households",
    },
    {
      method: "GET",
      path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
      updated: seed.authAccounts[0].updated,
    },
  ]);

  testing.mocks.responses = [
    {},
    {
      dataType: "AuthAccount",
      dataValue: [seed.authAccounts[0]],
    },
    {
      dataType: "AuthSession",
      dataValue: [AuthSessionState.new()],
    },
    {
      dataType: "AuthHousehold",
      dataValue: [seed.authHouseholds[0]],
    },
  ];

  testing.input("#form-item-input-household-join-token", "test");
  testing.click("#button-join-household");
  await testing.sleep(100);

  testing.requests([
    {
      method: "GET",
      path: `/api/v1/auth/households/${seed.authAccounts[0].id}/invites/test`,
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
