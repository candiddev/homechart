import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { ShopItemState } from "../states/ShopItem";
import { FormOverlayShopItem } from "./FormOverlayShopItem";

test("FormOverlayShopItem", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	ShopItemState.create = vi.fn();
	ShopItemState.delete = vi.fn();
	ShopItemState.update = vi.fn();

	const shopItem = {
		...ShopItemState.new(),
		...{
			authHouseholdID: seed.authHouseholds[0].id,
			id: "1" as NullUUID,
			name: "Test",
		},
	};

	testing.mount(FormOverlayShopItem, {
		data: shopItem,
	});

	// Buttons
	testing.find("#form-update-item");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(ShopItemState.delete)
		.toBeCalledWith("1");
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(ShopItemState.update)
		.toBeCalledTimes(1);
	shopItem.id = null;
	testing.redraw();
	testing.click("#button-add");
	await testing.sleep(100);
	expect(ShopItemState.create)
		.toBeCalledTimes(1);
	shopItem.id = "1";
	InfoState.data().cloud = false;
	testing.redraw();
	testing.notFind("#button-add");
	InfoState.data().cloud = true;
	testing.redraw();
	testing.find("#form-item-owner");
});
