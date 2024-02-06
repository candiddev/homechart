import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { InfoState } from "../states/Info";
import { ShopCategoryState } from "../states/ShopCategory";
import { FormOverlayShopCategory } from "./FormOverlayShopCategory";

test("FormOverlayShopCategory", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetPayeeState.data(seed.budgetPayees);
  ShopCategoryState.create = vi.fn();
  ShopCategoryState.delete = vi.fn();
  ShopCategoryState.update = vi.fn();

  const shopCategory = {
    ...ShopCategoryState.new(),
    ...{
      authHouseholdID: seed.authHouseholds[0].id,
      id: "1" as NullUUID,
      name: "Test",
    },
  };

  testing.mount(FormOverlayShopCategory, {
    data: shopCategory,
  });

  // Buttons
  testing.find("#form-update-category");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  expect(ShopCategoryState.delete).toBeCalledWith("1");
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(ShopCategoryState.update).toBeCalledTimes(1);
  shopCategory.id = null;
  testing.redraw();
  testing.click("#button-add");
  await testing.sleep(100);
  expect(ShopCategoryState.create).toBeCalledTimes(1);
  shopCategory.id = "1";
  InfoState.data().cloud = false;
  testing.redraw();
  testing.notFind("#button-add");
  InfoState.data().cloud = true;
  testing.redraw();

  // Household
  testing.find("#form-item-owner");

  // Name
  const name = testing.find("#form-item-input-name");
  testing.input(name, "Test2");
  testing.value(name, "Test2");
  expect(shopCategory.name).toBe("Test2");

  // Match
  const match = testing.find("#form-item-text-area-match");
  testing.input(match, "test");
  testing.value(match, "test");
  expect(shopCategory.match).toBe("test");

  // Store
  const store = testing.find("#form-item-select-default-store");
  testing.findAll(
    `#${store.id} option`,
    BudgetPayeeState.storeNames().length + 1,
  );
  testing.input(store, seed.budgetPayees[1].name);
  expect(shopCategory.budgetPayeeID).toBe(seed.budgetPayees[1].id);
});
