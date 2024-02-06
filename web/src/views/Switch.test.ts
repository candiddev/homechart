import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { Switch } from "./Switch";

test("Switch", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);

  testing.mount(Switch, {});

  testing.title("Switch Account");

  const users = testing.find("#form-item-select-select-child");
  expect(users.childNodes.length).toBe(1);
});
