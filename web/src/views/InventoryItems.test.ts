import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanTaskState } from "../states/PlanTask";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { InventoryItems } from "./InventoryItems";

describe("InventoryItems", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  InventoryCollectionState.data(seed.inventoryCollections);
  InventoryItemState.data(seed.inventoryItems);
  PlanTaskState.data(seed.planTasks);
  ShopCategoryState.data(seed.shopCategories);
  ShopItemState.data(seed.shopItems);

  test("filtering", async () => {
    testing.mount(App, routeOptions, InventoryItems);

    testing.findAll("tbody tr", 4);

    testing.click("#table-header-name > i");

    testing.input("#form-item-input-name", seed.inventoryItems[0].name);
    testing.redraw();
    testing.findAll("tbody tr", 1);

    testing.input("#form-item-input-name", "");
    testing.redraw();
    testing.findAll("tbody tr", 4);

    testing.click("#button-array-show-columns-propertieswarranty");
    testing.click("#table-header-propertieswarranty > i");
    testing.input("#form-item-input-warranty", "1");
    await testing.sleep(100);
    testing.findAll("tbody tr", 1);
    testing.click("#button-array-show-columns-propertieswarranty");
  });

  test("form.inventoryitem", async () => {
    testing.mocks.params = {
      collection: seed.inventoryCollections[0].id,
    };

    testing.mount(App, routeOptions, InventoryItems);

    testing.click(`#table-data-${seed.inventoryItems[0].id}-name`);
    await testing.sleep(300);
    testing.value("#form-item-input-name", seed.inventoryItems[0].name);
    testing.mocks.params = {};
  });

  test("form.shopitem", async () => {
    testing.mount(App, routeOptions, InventoryItems);

    const qty = testing.find(
      `#table-data-${seed.inventoryItems[0].id}-quantity`,
    );

    testing.click(`#${qty.id} .InventoryItems__buttons i:nth-of-type(3)`);

    testing.find("#form-new-item");
    testing.value("#form-item-input-name", seed.inventoryItems[0].name);
    testing.find("#button-add");
    testing.click("#button-cancel");
    await testing.sleep(300);
    testing.notFind("#form-create-item");

    ShopItemState.data([
      {
        ...ShopItemState.new(),
        ...{
          name: seed.inventoryItems[0].name,
        },
      },
    ]);

    testing.click(`#${qty.id} .InventoryItems__buttons > i:nth-of-type(3)`);
    expect(AppState.getLayoutAppAlerts()[0].message).toBe(
      "Item already on shopping list",
    );
  });

  test.each([
    [
      "all",
      "all",
      "ImageQuantitysortfilter_altNamearrow_downwardfilter_altLocationsortfilter_alt",
      4,
    ],
    [
      seed.inventoryCollections[0].name,
      "1",
      "ImageQuantitysortfilter_altNamearrow_downwardfilter_altLocationsortfilter_alt",
      4,
    ],
  ])("views.%s", async (_name, shortID, header, count) => {
    testing.mocks.params = {
      view: shortID,
    };

    testing.mount(App, routeOptions, InventoryItems);

    testing.text("#table-header", header);

    testing.findAll("tbody tr", count);
  });
});
