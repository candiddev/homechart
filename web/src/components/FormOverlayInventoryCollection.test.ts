import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { FormOverlayInventoryCollection } from "./FormOverlayInventoryCollection";

test("FormOverlayInventoryCollection", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	InventoryCollectionState.data(seed.inventoryCollections);
	InventoryCollectionState.create = vi.fn(async () => {
		return Promise.resolve({
			...InventoryCollectionState.new(),
			...{
				id: "1",
			},
		});
	});
	InventoryCollectionState.delete = vi.fn(async () => {
		return Promise.resolve();
	});
	InventoryCollectionState.update = vi.fn(async () => {
		return Promise.resolve();
	});
	InventoryItemState.data(seed.inventoryItems);

	const inventoryCollection = {
		...InventoryCollectionState.new(),
		...{
			authHouseholdID: seed.authHouseholds[0].id,
			id: "1" as NullUUID,
			name: "Test",
		},
	};

	testing.mount(FormOverlayInventoryCollection, {
		data: inventoryCollection,
	});

	// Buttons
	testing.find("#form-update-collection");
	testing.mocks.route = "/inventory/1";
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	await testing.sleep(100);
	expect(InventoryCollectionState.delete)
		.toBeCalledWith("1");
	expect(testing.mocks.route)
		.toBe("/inventory");
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(InventoryCollectionState.update)
		.toBeCalledTimes(1);
	inventoryCollection.id = null;
	testing.redraw();
	testing.click("#button-add");
	await testing.sleep(100);
	expect(InventoryCollectionState.create)
		.toBeCalledTimes(1);
	expect(testing.mocks.route)
		.toBe("/inventory/1");
	inventoryCollection.id = "1";
	InfoState.data().cloud = false;
	testing.redraw();
	testing.notFind("#button-add");
	InfoState.data().cloud = true;
	testing.redraw();

	testing.find("#form-item-owner");

	testing.value("#form-item-input-name", "Test");
	testing.input("#form-item-input-name", "Test1");
	expect(inventoryCollection.name)
		.toBe("Test1");

	testing.findAll("#form-item-datalist-grouping option", 2);
	testing.input("#form-item-input-grouping", "Test1");
	testing.value("#form-item-input-grouping", "Test1");
	expect(inventoryCollection.grouping)
		.toBe("Test1");

	testing.input("#form-item-input-icon", "a");
	testing.value("#form-item-input-icon", "a");
	expect(inventoryCollection.icon)
		.toBe("a");

	testing.click("#button-add-filter");
	testing.findAll("#form-item-datalist-properties-key-0 option", 5);
	testing.findAll(".FormItem__multi", 1);

	testing.find("#form-image-qr-code");
});
