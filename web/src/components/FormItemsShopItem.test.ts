import { Recurrence } from "@lib/types/Recurrence";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { PlanProjectState } from "../states/PlanProject";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { FormShopItem } from "./FormItemsShopItem";

test("FormShopItem", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetPayeeState.data(seed.budgetPayees);
  CookMealPlanState.data(seed.cookMealPlans);
  CookMealTimeState.data(seed.cookMealTimes);
  CookRecipeState.data(seed.cookRecipes);
  PlanProjectState.data(seed.planProjects);
  ShopCategoryState.data(seed.shopCategories);
  ShopListState.data(seed.shopLists);

  const shopItem = {
    ...ShopItemState.new(),
    ...{
      authHouseholdID: seed.authHouseholds[0].id,
      id: "1" as NullUUID,
      name: "Test",
    },
  };

  testing.mount(FormShopItem, {
    data: shopItem,
  });

  testing.find("#form-item-owner");

  testing.input("#form-item-input-name", "mushrooms");
  expect(shopItem.name).toBe("mushrooms");
  testing.redraw();
  AuthAccountState.data().primaryAuthHouseholdID = null;
  testing.redraw();
  testing.notFind("#form-item-select-category");
  testing.notFind("#form-item-select-store");
  AuthAccountState.data().primaryAuthHouseholdID = "1";
  testing.redraw();
  testing.value("#form-item-select-category", seed.shopCategories[0].id);
  expect(shopItem.shopCategoryID).toBe(seed.shopCategories[0].id);
  testing.findAll(
    "#form-item-select-store > option",
    BudgetPayeeState.storeNames().length + 1,
  );
  testing.value("#form-item-select-store", seed.budgetPayees[1].name);
  expect(shopItem.budgetPayeeID).toBe(seed.budgetPayees[1].id);
  expect(shopItem.authAccountID).toBeNull();
  testing.input("#form-item-select-list", seed.shopLists[0].id);
  testing.value("#form-item-select-list", seed.shopLists[0].id);
  expect(shopItem.shopListID).toBe(seed.shopLists[0].id);
  expect(shopItem.authAccountID).toBe(seed.authAccounts[0].id);
  testing.click(`#form-item-option-project-${seed.planProjects[5].id}`);
  testing.hasClass(
    `#form-item-option-project-${seed.planProjects[5].id}`,
    "FormItemSelectNested__option--selected",
  );
  expect(shopItem.planProjectID).toBe(seed.planProjects[5].id);

  // Budget Category
  const price = testing.find("#form-item-input-price");
  testing.input(price, "-$5.00");
  expect(shopItem.price).toBe(500);
  testing.value(price, "-$5.00");

  // Recurrence
  testing.notFind("#form-item-label-recurrence");
  testing.click("#form-checkbox-input-make-staple");
  testing.find("#form-item-label-recurrence");
  expect(shopItem.recurrence).toStrictEqual({
    ...Recurrence.new(),
    ...{
      separation: 1,
    },
  });
  testing.click("#form-checkbox-input-make-staple");
  expect(shopItem.recurrence).toBeNull();
  testing.notFind("#form-recurrence");
});
