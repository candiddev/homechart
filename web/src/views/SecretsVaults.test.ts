import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { SecretsVaultState } from "../states/SecretsVault";
import { SecretsVaults } from "./SecretsVaults";

test("SecretsVaults", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  await AuthAccountState.decryptPrivateKeys("");
  SecretsVaultState.data(seed.secretsVaults);
  await testing.sleep(100);

  testing.mount(App, routeOptions, SecretsVaults);

  testing.title("Secrets");
  testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
  testing.findAll("tbody tr", 3);
  testing.text("#table-data-all-name", "All");
  testing.text(
    `#table-data-${seed.secretsVaults[1].id}-name`,
    seed.secretsVaults[1].name,
  );
  testing.text(
    `#table-data-${seed.secretsVaults[1].id}-icon`,
    seed.secretsVaults[1].icon,
  );
  testing.click("#table-row_all");
  expect(testing.mocks.route).toBe("/secrets/all");
  testing.click(`#table-row_${seed.secretsVaults[1].id}`);
  testing.click("#button-delete");
  testing.mocks.responses.push({});
  testing.click("#button-confirm-delete");
  await testing.sleep(100);
  testing.redraw();
  testing.notFind("#button-cancel");
  testing.findAll("tbody tr", 2);
  testing.click("#tab-personal");
  expect(testing.mocks.route).toBe("/secrets?filter=personal");
  testing.click("#tab-household");
  expect(testing.mocks.route).toBe("/secrets?filter=household");
  testing.mocks.params = {
    filter: "household",
  };
  testing.mount(App, routeOptions, SecretsVaults);
  testing.findAll("tbody tr", 1);
});
