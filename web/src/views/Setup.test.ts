import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { PaymentState } from "../states/Payment";
import { Setup } from "./Setup";

test("Setup", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);

  InfoState.data().cloud = true;
  PaymentState.prices().monthly = "$3.00";

  testing.mocks.responses = [
    {
      status: 0,
    },
    {
      dataType: "AuthHousehold",
      dataValue: [seed.authHouseholds[0]],
    },
    {
      status: 0,
    },
  ];
  testing.mount(Setup);

  testing.find("#welcome");
  testing.find("#button-finish");

  const progress = testing.find("#form-progress");
  testing.text(
    progress,
    "Welcome1 - Setup Account2 - Setup Household3 - Setup Subscription",
  );
  testing.hasClass("#form-progress a", "Form__progress--current");

  testing.click("#button-next");
  await testing.sleep(100);
  expect(testing.mocks.route).toBe("/setup/account");

  testing.mocks.params.target = "account";
  testing.mount(Setup);

  testing.find("#button-finish");
  testing.find("#form");
  testing.click("#button-next");
  await testing.sleep(100);
  expect(testing.mocks.route).toBe("/setup/household");

  testing.mocks.params.target = "household";
  testing.mount(Setup);

  testing.find("#form-contents");
  testing.click("#button-next");
  await testing.sleep(100);
  expect(testing.mocks.route).toBe("/setup/subscription");

  testing.mocks.params.target = "subscription";
  testing.mount(Setup);

  testing.click("#button-finish");
  await testing.sleep(100);
  expect(testing.mocks.route).toBe("/home");
});
