import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { SettingsNotifications } from "./SettingsNotifications";

test("SettingsNotifications", async () => {
  const account = seed.authAccounts[0];
  AuthAccountState.data(account);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);

  testing.mount(SettingsNotifications, {});
  testing.title("Settings - Notifications");

  // Daily Agenda Time
  testing.value("#form-item-select-daily-agenda-time", "0");
  testing.mocks.responses.push({
    dataType: "AuthAccount",
    dataValue: [
      {
        ...account,
        ...{
          dailyAgendaNext: null,
        },
      },
    ],
  });
  testing.input("#form-item-select-daily-agenda-time", "Disabled");
  await testing.sleep(100);
  testing.value("#form-item-select-daily-agenda-time", "Disabled");
  testing.mocks.responses.push({
    dataType: "AuthAccount",
    dataValue: [
      {
        ...account,
        ...{
          dailyAgendaNext: "2021-07-10T07:00:00",
          dailyAgendaTime: "02:00",
        },
      },
    ],
  });
  testing.input("#form-item-select-daily-agenda-time", "1");
  await testing.sleep(100);
  testing.value("#form-item-select-daily-agenda-time", "2");

  testing.findAll("tbody tr", 14);
  testing.text(
    "#table-data-smith-family-task-reminders-type",
    "Smith Family Task Reminders",
  );
  testing.text("#table-data-daily-agenda-type", "Daily Agenda");

  // Email clicking
  testing.text("#table-data-newsletter-type", "Newsletter");
  const emailNewsletter = testing.find("#table-data-newsletter-email");
  testing.text(emailNewsletter, "check_box");
  testing.mocks.responses.push({
    dataType: "AuthAccount",
    dataValue: [
      {
        ...account,
        ...{
          preferences: {
            ...account.preferences,
            ...{
              ignoreEmailNewsletter: true,
            },
          },
        },
      },
    ],
  });
  testing.click(emailNewsletter);
  await testing.sleep(100);
  testing.text("#table-data-newsletter-email", "check_box_outline_blank");

  // Device clicking
  testing.text(
    "#table-data-doe-family-task-reminders-type",
    "Doe Family Task Reminders",
  );
  testing.text("#table-data-doe-family-task-reminders-device", "check_box");
  testing.mocks.responses.push({
    dataType: "AuthAccount",
    dataValue: [
      {
        ...account,
        ...{
          preferences: {
            ...account.preferences,
            ...{
              notificationsHouseholds: [
                {
                  ...AuthAccountState.newNotificationsHouseholds(),
                  ...{
                    authHouseholdID: seed.authHouseholds[0].id,
                    ignoreDevicePlanTask: true,
                  },
                },
              ],
            },
          },
        },
      },
    ],
  });
  testing.click("#table-data-doe-family-task-reminders-device");
  await testing.sleep(100);
  testing.text(
    "#table-data-doe-family-task-reminders-device",
    "check_box_outline_blank",
  );
});
