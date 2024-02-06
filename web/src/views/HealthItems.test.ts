import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import { HealthItems } from "./HealthItems";

beforeAll(() => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  HealthItemState.loading = 1;
  HealthItemState.set(seed.healthItems);
  HealthLogState.data(seed.healthLogs);
});

describe("HealthItems", () => {
  test("inputs/table/form", async () => {
    testing.mocks.params = {
      id: `${seed.authAccounts[0].id}`,
      type: "inputs",
    };

    testing.mount(App, routeOptions, HealthItems);
    testing.title("Health - Inputs");
    testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
    testing.findAll("tbody tr", 22);
    testing.text(
      `#table-data-${HealthItemState.findName("Beans").id}-name`,
      "Beans",
    );
    testing.text(
      `#table-data-${seed.healthItems[1].id}-name`,
      "GingerRestless Legs (1)",
    );
    testing.text(
      `#table-data-${seed.healthItems[1].id}-totalcorrelations`,
      "1",
    );
    testing.click(`#table-row_${seed.healthItems[1].id}`);
    testing.value("#form-item-input-name", seed.healthItems[1].name);
    testing.input("#form-item-input-name", `${seed.healthItems[1].name}1`);
    testing.mocks.responses.push({
      dataType: "HealthItem",
      dataValue: [
        {
          ...seed.healthItems[1],
          ...{
            name: `${seed.healthItems[1].name}1`,
          },
        },
      ],
    });
    testing.click("#button-update");
    await testing.sleep(100);
    testing.notFind("#button-cancel");
    testing.text(
      `#table-data-${seed.healthItems[1].id}-name`,
      `${seed.healthItems[1].name}1Restless Legs (1)`,
    );
    HealthItemState.data(seed.healthItems);
  });

  test("outputs", async () => {
    testing.mocks.params = {
      id: `${seed.authAccounts[0].id}`,
      type: "outputs",
    };

    testing.mount(App, routeOptions, HealthItems);
    testing.title("Health - Outputs");
    testing.findAll("tbody tr", 19);
    testing.text(
      `#table-data-${HealthItemState.findName("Restless Legs").id}-name`,
      "Restless LegsPineapple (2)Ginger (1)",
    );
  });
});
