import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";
import m from "mithril";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanProjectState } from "../states/PlanProject";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopListState } from "../states/ShopList";
import { CookRecipesID } from "./CookRecipesID";

const response = {
  dataType: "CookRecipe",
  dataValue: [seed.cookRecipes[0]],
};

beforeEach(() => {
  m.mount(document.body, null);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetPayeeState.data(seed.budgetPayees);
  CookRecipeState.data(seed.cookRecipes.slice(0, 1));
  CookMealTimeState.data(seed.cookMealTimes);
  InventoryItemState.data(seed.inventoryItems);
  PlanProjectState.data(seed.planProjects);
  ShopCategoryState.data(seed.shopCategories);
  ShopListState.data(seed.shopLists);
  testing.mocks.responses = [response];
});

describe("CookRecipesID", () => {
  test("details", async () => {
    testing.mocks.route = `/cook/recipes/${seed.cookRecipes[0].id}`;
    testing.mocks.params.id = seed.cookRecipes[0].id;
    testing.mount(App, routeOptions, CookRecipesID);

    testing.redraw();
    testing.title(`Cook - Recipes - ${seed.cookRecipes[0].name}`);
    testing.text(
      "#breadcrumbs",
      `home > Cook > Recipes > ${seed.cookRecipes[0].name}`,
    );

    testing.find("#form-image-image");
    testing.text(
      "#form-item-input-servings",
      `${seed.cookRecipes[0].servings}`,
    );
    testing.text("#form-item-multi-prep-time", "0Hours10Minutes");
    testing.text("#form-item-multi-cook-time", "0Hours10Minutes");
    testing.text("#form-item-icons-complexity", "starstarstarstar");
    testing.text("#form-item-input-source", "homechart.app");
    testing.input("#form-item-input-scale", "2");
    await testing.sleep(500);
    testing.text(
      "#form-item-text-area-ingredients p",
      CookRecipeState.scaleIngredients(
        seed.cookRecipes[0].ingredients,
        "2",
      ).replace(/\n/g, ""),
    );
    testing.text(
      "#form-item-input-times-made",
      `${seed.cookRecipes[0].cookMealPlanCount}`,
    );
    testing.text(
      "#form-item-input-last-made",
      `${AppState.formatCivilDate(seed.cookRecipes[0].cookMealPlanLast)}`,
    );
    testing.find("#form-item-text-area-directions");
    testing.findAll("#notes .Title", 2);
  });

  test("ID - authenticated", async () => {
    testing.mocks.route = `/cook/recipes/${seed.cookRecipes[0].id}`;
    testing.mocks.params.id = seed.cookRecipes[0].id;
    testing.mount(App, routeOptions, CookRecipesID);
    testing.redraw();
    testing.title(`Cook - Recipes - ${seed.cookRecipes[0].name}`);
    testing.text(
      "#breadcrumbs",
      `home > Cook > Recipes > ${seed.cookRecipes[0].name}`,
    );
    testing.text("#button-delete", "deleteDelete");
    testing.text("#button-edit", "editEdit");
    testing.click("#app-toolbar-action-toggle");
    testing.find("#dropdown-item-ingredients-to-shopping-list");
    testing.find("#dropdown-item-cookmealplan");
    testing.find("#dropdown-item-cookrecipe");
    testing.find("#dropdown-item-copy-recipe");
    testing.find("#dropdown-item-import-recipe-from-website");

    CookRecipeState.data([]);
    testing.mount(CookRecipesID);
    testing.notFind("#form-item-text-area-directions");
    testing.find("#form-loading");
  });

  test("ID - unauthenticated", async () => {
    CookRecipeState.data([]);
    AppState.setSessionAuthenticated(false);
    testing.mocks.route = `/cook/recipes/${seed.cookRecipes[0].id}`;
    testing.mocks.params.id = seed.cookRecipes[0].id;
    testing.mount(
      App,
      {
        ...routeOptions,
        ...{
          public: true,
        },
      },
      CookRecipesID,
    );
    await testing.sleep(100);
    expect(testing.mocks.route).toBe(`/cook/recipes/${seed.cookRecipes[0].id}`);
    testing.redraw();
    testing.title(`Cook - Recipes - ${seed.cookRecipes[0].name}`);
    testing.text(
      "#breadcrumbs",
      `home > Cook > Recipes > ${seed.cookRecipes[0].name}`,
    );
    testing.notFind("#app-header-action-toggle");
    testing.notFind("#dropdown-item-copy-recipe");
    testing.findAll(".Title__header button", 0);
    AppState.setSessionAuthenticated(true);
  });

  test("edit", async () => {
    testing.mocks.route = `/cook/recipes/${seed.cookRecipes[0].id}`;
    testing.mocks.params.id = seed.cookRecipes[0].id;
    testing.mocks.params.edit = "";
    testing.mount(App, routeOptions, CookRecipesID);
    testing.find("#form-item-input-name");
    testing.click("#button-edit");
    testing.text("#button-cancel", "cancelCancel");
  });

  test("delete", async () => {
    testing.mocks.params = {
      id: seed.cookRecipes[0].id,
    };
    testing.mount(App, routeOptions, CookRecipesID);
    testing.mocks.responses = [
      {
        dataType: "CookRecipe",
        dataValue: [
          {
            ...seed.cookRecipes[0],
            ...{
              deleted: Timestamp.now.toString(),
            },
          },
        ],
      },
    ];
    testing.click(".Title__header button");
    await testing.sleep(100);
    CookRecipeState.data()[0].deleted = Timestamp.now.toString();
    expect(
      CookRecipeState.findName(seed.cookRecipes[0].name).deleted,
    ).not.toBeNull();
    expect(testing.mocks.route).toBe("/cook/recipes");
  });

  test("copy", async () => {
    testing.mocks.route = "/cook/recipes/new?edit";
    testing.mocks.params = {
      copy: "",
      edit: "",
      id: seed.cookRecipes[0].id,
    };
    CookRecipeState.data(seed.cookRecipes);
    testing.mount(App, routeOptions, CookRecipesID);
    testing.text("#button-cancel", "cancelCancel");
    testing.text("#button-save", "saveSave");
  });
});
