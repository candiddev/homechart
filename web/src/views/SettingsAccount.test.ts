import { App } from "@lib/layout/App";
import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { SettingsAccount } from "./SettingsAccount";

test("SettingsAccount", async () => {
  InfoState.data().cloud = true;

  testing.mocks.responses = [
    {
      dataType: "OIDCProviders",
      dataValue: [OIDCProviderTypeEnum.Google],
    },
  ];

  AuthAccountState.data(seed.authAccounts[0]);
  AuthSessionState.data(seed.authSessions[0]);
  AuthHouseholdState.data([
    {
      ...seed.authHouseholds[0],
      ...{
        subscriptionProcessor: AuthHouseholdSubscriptionProcessorEnum.Apple,
      },
    },
  ]);
  AuthHouseholdState.data([
    {
      ...AuthHouseholdState.data()[0],
      ...{
        members: [AuthHouseholdState.findMember(seed.authAccounts[0].id)],
      },
    },
  ]);

  testing.mount(App, routeOptions, SettingsAccount);
  testing.title("Settings - Account");

  testing.hasClass("#tab-preferences", "Title__tab--active");
  testing.find("#form");
  testing.find("#form-item-input-email-address");

  // Hide components tab
  testing.click("#tab-hide-components");
  testing.hasClass("#tab-hide-components", "Title__tab--active");
  testing.find("#table-components");

  // Security tab
  testing.click("#tab-security");
  testing.hasClass("#tab-security", "Title__tab--active");
  await testing.sleep(100);

  // Private keys
  testing.text("#title-private-key", "Private Key");
  testing.click("#button-reset-private-keys");
  testing.click("#button-yes-please-remove-my-ability-to-read-my-secrets");
  testing.click("#button-yes-i-understand-this-is-not-reversible");
  testing.mocks.requests = [];
  testing.mocks.responses = [
    {
      dataType: "AuthAccount",
      dataValue: [
        {
          ...seed.authAccounts[0],
          ...{
            privateKeys: [],
            publicKey: "",
          },
        },
      ],
    },
    {
      dataType: "AuthAccount",
      dataValue: [seed.authAccounts[0]],
    },
  ];
  testing.click("#button-erase-my-keys");
  await testing.sleep(100);
  testing.requests([
    {
      body: {
        ...seed.authAccounts[0],
        ...{
          privateKeys: [],
          publicKey: "",
        },
      },
      method: "PUT",
      path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}/keys`,
    },
  ]);
  testing.input("#form-item-input-new-passphrase", "testing");
  testing.input("#form-item-input-confirm-new-passphrase", "testing");
  testing.click("#button-add-private-key");
  await testing.sleep(800);
  testing.text("#table-data--name", "Demo");
  testing.click("#table-row_");
  testing.value("#form-item-input-name", "Demo");
  testing.click("#button-cancel");

  // New Password
  testing.hasAttribute("#form-item-input-new-password", "type", "password");
  testing.hasAttribute(
    "#form-item-input-confirm-new-password",
    "type",
    "password",
  );
  testing.find("#button-google");
  testing.find("#button-setup-two-factor-authentication");

  // Test OIDC
  AuthAccountState.data({
    ...AuthAccountState.data(),
    ...{
      oidcProviderType: 2,
    },
  });
  testing.redraw();
  await testing.sleep(100);
  testing.notFind("#form-item-input-new-password");
  testing.find("#button-remove-sign-in-with-google");
  testing.notFind("#form-two-factor-authentication");

  // Delete account
  testing.click("#tab-delete-account");
  testing.hasClass("#tab-delete-account", "Title__tab--active");
  const del = testing.find("#button-delete-account");
  testing.click(del);
  testing.mocks.requests = [];
  testing.mocks.responses = [{}, {}, {}];
  testing.click("#button-confirm-delete-account");
  await testing.sleep(100);
  testing.requests([
    {
      body: {
        authHouseholdID: seed.authHouseholds[0].id,
      },
      method: "DELETE",
      path: "/api/v1/payments",
    },
    {
      method: "DELETE",
      path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
    },
  ]);
});
