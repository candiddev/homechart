import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { SettingsHouseholdsID } from "./SettingsHouseholdsID";

test("SettingsHouseholdsID", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);

  testing.mocks.responses = [
    {
      dataType: "AuthHousehold",
      dataValue: [seed.authHouseholds[0]],
    },
    {
      dataType: "AuthSession",
      dataValue: [seed.authSessions[0]],
    },
  ];

  testing.mocks.params.id = seed.authHouseholds[0].id;

  testing.mount(SettingsHouseholdsID);
  testing.title("Settings - Households - Doe Family");

  // Preferences
  testing.hasClass("#tab-preferences", "Title__tab--active");
  testing.find("#form-item-input-name");
  testing.find("#form-item-select-meal-plan-color");
  testing.find("#form-item-select-recurring-transaction-color");
  testing.find("#form-item-select-task-color");
  const currencyFormat = testing.find("#form-item-select-currency-format");
  testing.input(currencyFormat, "2");
  testing.value(currencyFormat, "2");
  testing.mocks.requests = [];
  testing.click("#button-update");
  await testing.sleep(100);
  testing.requests([
    {
      body: {
        ...seed.authHouseholds[0],
        ...{
          preferences: {
            ...seed.authHouseholds[0].preferences,
            currency: 2,
          },
        },
      },
      method: "PUT",
      path: `/api/v1/auth/households/${seed.authHouseholds[0].id}`,
    },
  ]);

  testing.notFind("#button-import-household");
  InfoState.data().cloud = false;
  testing.redraw();
  testing.find("#button-export-household");
  testing.find("#button-import-household");

  testing.click("#tab-members");
  testing.hasClass("#tab-members", "Title__tab--active");
  testing.find("#table");

  testing.click("#tab-hide-components");
  testing.hasClass("#tab-hide-components", "Title__tab--active");
  testing.find("#table-components");
});
