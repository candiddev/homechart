import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { InfoState } from "../states/Info";
import { ShopListState } from "../states/ShopList";
import { FormOverlayShopList } from "./FormOverlayShopList";

test("FormOverlayShopList", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  BudgetCategoryState.data(seed.budgetCategories);
  AuthSessionState.data(seed.authSessions[0]);
  ShopListState.create = vi.fn();
  ShopListState.delete = vi.fn(async () => {
    return Promise.resolve();
  });
  ShopListState.update = vi.fn();

  const shopList = {
    ...ShopListState.new(),
    ...{
      authHouseholdID: seed.authHouseholds[0].id,
      id: "1" as NullUUID,
      name: "Test",
    },
  };

  testing.mount(FormOverlayShopList, {
    data: shopList,
  });

  // Buttons
  testing.find("#form-update-list");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  expect(ShopListState.delete).toBeCalledWith("1");
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(ShopListState.update).toBeCalledTimes(1);
  shopList.id = null;
  testing.redraw();
  testing.click("#button-add");
  await testing.sleep(100);
  expect(ShopListState.create).toBeCalledTimes(1);
  shopList.id = "1";
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
  expect(shopList.name).toBe("Test2");

  // Icon
  const match = testing.find("#form-item-input-icon");
  testing.input(match, "add");
  testing.value(match, "add");
  expect(shopList.icon).toBe("add");

  // Budget Category
  const budget = testing.find("#form-item-select-budget-category");
  testing.input(
    budget,
    `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`,
  );
  expect(shopList.budgetCategoryID).toBe(seed.budgetCategories[1].id);
  testing.value(
    budget,
    `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`,
  );
});
