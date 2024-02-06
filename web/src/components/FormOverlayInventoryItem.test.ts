import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanTaskState } from "../states/PlanTask";
import { FormOverlayInventoryItem } from "./FormOverlayInventoryItem";

test("FormOverlayInventoryItem", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  InventoryCollectionState.data(seed.inventoryCollections);
  InventoryItemState.data(seed.inventoryItems);
  InventoryItemState.create = vi.fn();
  InventoryItemState.delete = vi.fn();
  InventoryItemState.update = vi.fn();
  PlanTaskState.data([
    {
      ...PlanTaskState.new(),
      ...{
        id: "1",
        inventoryItemID: "1",
        name: "Test",
        shortID: "1",
      },
    },
  ]);

  const inventoryItem = {
    ...InventoryItemState.new(),
    ...{
      authHouseholdID: seed.authHouseholds[0].id,
      id: "1" as NullUUID,
      name: "Test",
    },
  };

  testing.mount(FormOverlayInventoryItem, {
    data: inventoryItem,
  });

  // Buttons
  testing.find("#form-update-item");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  await testing.sleep(100);
  expect(InventoryItemState.delete).toBeCalledWith("1");
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(InventoryItemState.update).toBeCalledTimes(1);
  inventoryItem.id = null;
  testing.redraw();
  testing.click("#button-add");
  await testing.sleep(100);
  expect(InventoryItemState.create).toBeCalledTimes(1);
  inventoryItem.id = "1";
  testing.redraw();
  InfoState.data().cloud = false;
  testing.redraw();
  testing.notFind("#button-add");
  InfoState.data().cloud = true;
  testing.redraw();

  testing.find("#form-item-owner");

  testing.value("#form-item-input-name", "Test");
  testing.input("#form-item-input-name", "Test1");
  expect(inventoryItem.name).toBe("Test1");

  testing.find("#form-image-label-image");

  testing.value("#form-item-input-quantity", "1");
  testing.input("#form-item-input-quantity", "5");
  expect(inventoryItem.quantity).toBe(5);

  testing.findAll(".FormItem__multi", 0);
  testing.click("#button-add-property");
  testing.findAll("#form-item-datalist-properties-key-0 option", 5);
  testing.findAll(".FormItem__multi", 1);
  testing.input("#form-item-input-properties-key-0", "Brand");
  await testing.sleep(100);
  testing.findAll("#form-item-datalist-properties-value-0 option", 3);
  testing.input("#form-item-input-properties-value-0", "test");
  await testing.sleep(100);
  expect(inventoryItem.properties).toStrictEqual({
    Brand: "test",
  });
  testing.click("#button-delete-0");
  testing.findAll(".FormItem__multi", 0);

  testing.value("#form-item-input-upc", "");
  testing.input("#form-item-input-upc", "upc");
  expect(inventoryItem.upc).toBe("upc");

  testing.text("#form-item-text-area-associated-tasks", "doneTest");

  testing.find("#form-image-qr-code");
});
