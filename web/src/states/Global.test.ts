import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { API, apiEndpoint } from "../services/API";
import { Permission, PermissionComponentsEnum } from "../types/Permission";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { GlobalState } from "./Global";
import { InfoState } from "./Info";

describe("GlobalState", () => {
  const yesterday = Timestamp.now();
  yesterday.addDays(-2);

  const tomorrow = Timestamp.now();
  yesterday.addDays(1);

  const nextWeek = Timestamp.now();
  nextWeek.addDays(7);

  AuthAccountState.data().setup = true;

  test.each([
    ["not cloud, no subscription", false, null, null, "Finish setting up"],
    [
      "not cloud, expires yesterday",
      false,
      "a",
      yesterday.toCivilDate().toJSON(),
      "Your Homechart subscription expired",
    ],
    [
      "cloud, expires yesterday",
      true,
      "a",
      yesterday.toCivilDate().toJSON(),
      "Your Homechart subscription expired",
    ],
    [
      "not cloud, expires tomorrow",
      false,
      "a",
      tomorrow.toCivilDate().toJSON(),
      "Your Homechart subscription will",
    ],
    [
      "cloud, expires tomorrow",
      true,
      "a",
      tomorrow.toCivilDate().toJSON(),
      "Your Homechart subscription will",
    ],
    [
      "not cloud, expires next week",
      false,
      "a",
      nextWeek.toCivilDate().toJSON(),
      "",
    ],
    [
      "cloud, expires next week",
      true,
      "a",
      nextWeek.toCivilDate().toJSON(),
      "",
    ],
  ])("alertSubscription: %s", (_name, cloud, id, expires, messageRegex) => {
    InfoState.data().cloud = cloud;
    AuthHouseholdState.data([
      {
        ...AuthHouseholdState.new(),
        ...{
          id: id,
          subscriptionExpires: expires,
        },
      },
    ]);

    GlobalState.alertSubscription();

    if (messageRegex === "") {
      expect(AppState.getLayoutAppAlerts()).toHaveLength(0);
    } else {
      expect(AppState.getLayoutAppAlerts()[0].message).toMatch(messageRegex);
    }

    AppState.data.layoutAppAlerts = [];
  });

  test("permitted", () => {
    AppState.setSessionAuthenticated(false);
    AuthSessionState.data({
      ...AuthSessionState.data(),
      ...{
        permissionsAccount: {
          ...Permission.new(),
          ...{
            calendar: 1,
          },
        },
        permissionsHouseholds: [
          {
            authHouseholdID: seed.authHouseholds[0].id,
            permissions: {
              ...Permission.new(),
              ...{
                auth: 1,
                cook: 1,
              },
            },
          },
        ],
      },
    });

    expect(
      GlobalState.permitted(PermissionComponentsEnum.Auth, true),
    ).toBeFalsy();
    AppState.setSessionAuthenticated(true);
    expect(
      GlobalState.permitted(PermissionComponentsEnum.Auth, true),
    ).toBeTruthy();
    expect(
      GlobalState.permitted(PermissionComponentsEnum.Auth, true),
    ).toBeTruthy();
    expect(
      GlobalState.permitted(
        PermissionComponentsEnum.Auth,
        true,
        seed.authHouseholds[0].id,
      ),
    ).not.toBeTruthy();
    expect(
      GlobalState.permitted(PermissionComponentsEnum.Calendar, false),
    ).toBeTruthy();
    expect(
      GlobalState.permitted(PermissionComponentsEnum.Calendar, true),
    ).not.toBeTruthy();
    expect(
      GlobalState.permitted(
        PermissionComponentsEnum.Cook,
        true,
        seed.authHouseholds[0].id,
      ),
    ).not.toBeTruthy();
  });

  test("switch", async () => {
    await API.setAuth({
      id: "1",
      key: "1",
    });

    AuthAccountState.data(seed.authAccounts[0]);

    testing.mocks.responses = [
      {
        dataType: "AuthSession",
        dataValue: [seed.authSessions[0]],
      },
      {},
      {
        dataType: "Info",
        dataValue: [
          {
            cloud: true,
          },
        ],
      },
      {
        dataType: "AuthSession",
        dataValue: [seed.authSessions[0]],
      },
      {
        dataType: "AuthAccount",
        dataValue: [seed.authAccounts[0]],
      },
      {
        dataType: "AuthHouseholds",
        dataValue: seed.authHouseholds,
      },
      {
        dataType: "FCM",
        dataValue: [
          {
            appID: "app",
          },
        ],
      },
    ];

    await GlobalState.switch();

    expect(apiEndpoint()).toStrictEqual({
      debug: false,
      hostname: "",
      id: seed.authSessions[0].id,
      key: seed.authSessions[0].key,
    });
  });
});
