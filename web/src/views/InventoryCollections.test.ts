import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryCollections } from "./InventoryCollections";

test("InventoryCollections", async () => {
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  InventoryCollectionState.data(seed.inventoryCollections);

  testing.mount(App, routeOptions, InventoryCollections);

  testing.title("Inventory - All Collections");
  testing.text("#table-header-name", "Namearrow_downwardfilter_alt");
  testing.findAll("tbody tr", 7);
  testing.text("#table-data-all-name", "All");
  testing.text(
    `#table-data-${seed.inventoryCollections[2].id}-name`,
    seed.inventoryCollections[2].name,
  );
  testing.text(
    `#table-data-${seed.inventoryCollections[2].id}-grouping`,
    seed.inventoryCollections[2].grouping,
  );
  testing.text(
    `#table-data-${seed.inventoryCollections[2].id}-icon`,
    seed.inventoryCollections[2].icon,
  );
  testing.click("#table-row_all");
  expect(testing.mocks.route).toBe("/inventory/all");
  testing.click(`#table-row_${seed.inventoryCollections[2].id}`);
  testing.click("#button-delete");
  testing.mocks.responses.push({});
  testing.click("#button-confirm-delete");
  await testing.sleep(100);
  testing.redraw();
  testing.notFind("#button-cancel");
  testing.findAll("tbody tr", 6);
});
