import { App } from "@lib/layout/App";
import { Recurrence } from "@lib/types/Recurrence";
import { Clone } from "@lib/utilities/Clone";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { PlanProjectState } from "../states/PlanProject";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { ShopItems } from "./ShopItems";

const items = [
  {
    ...ShopItemState.new(),
    ...{
      budgetPayeeID: seed.budgetPayees[0].id,
      cookRecipeID: seed.cookRecipes[0].id,
      id: "1",
      name: "a",
      planProjectID: seed.planProjects[6].id,
      price: 1200,
      recurrence: Recurrence.new(),
      shopCategoryID: seed.shopCategories[0].id,
    },
  },
  {
    ...ShopItemState.new(),
    ...{
      budgetPayeeID: seed.budgetPayees[1].id,
      cookRecipeID: seed.cookRecipes[1].id,
      id: "2",
      inCart: true,
      name: "b",
      price: 1500,
      shopCategoryID: seed.shopCategories[1].id,
    },
  },
  {
    ...ShopItemState.new(),
    ...{
      budgetPayeeID: seed.budgetPayees[2].id,
      cookRecipeID: seed.cookRecipes[2].id,
      id: "3",
      inCart: true,
      name: "c",
      shopCategoryID: seed.shopCategories[2].id,
    },
  },
];

beforeEach(() => {
  BudgetPayeeState.data(seed.budgetPayees);
  CookMealPlanState.data(seed.cookMealPlans);
  CookMealTimeState.data(seed.cookMealTimes);
  CookRecipeState.data(seed.cookRecipes);
  PlanProjectState.data(seed.planProjects);
  ShopCategoryState.data(seed.shopCategories);
  ShopItemState.data(Clone(items));
  ShopListState.data(seed.shopLists);
});

describe("ShopItems", () => {
  test("no filter", async () => {
    testing.mocks.params = {
      filter: undefined,
    };
    testing.mount(App, routeOptions, ShopItems);
    testing.title("Shop - Pick Up");
    testing.text("#table-header-shopcategoryid", "Categoryarrow_downward");
    testing.text("#subtitle-cost", "Cost $12.00");
    testing.findAll("tbody tr", items.length);
    testing.text("#table-data-3-incart", "check_box");
    testing.text("#table-data-1-incart", "check_box_outline_blank");
    testing.text("#table-data-1-name", `${items[0].name}Skip`);
    testing.text("#table-data-1-shopcategoryid", seed.shopCategories[0].name);
    testing.text("#table-data-1-budgetpayeeid", seed.budgetPayees[0].name);
    testing.text("#table-data-1-planprojectid", seed.planProjects[6].name);
    testing.text("#table-data-1-price", "-$12.00");
    testing.click("#table-row_1");
    await testing.sleep(100);
    testing.value("#form-item-input-name", items[0].name);
    testing.input("#form-item-input-name", `${items[0].name}1`);
    testing.mocks.responses.push({
      dataType: "ShopItem",
      dataValue: [
        {
          ...items[0],
          ...{
            name: `${items[0].name}1`,
          },
        },
      ],
    });
    testing.click("#button-update");
    ShopItemState.data()[0].name = `${items[0].name}1`;
    await testing.sleep(100);
    testing.notFind("#button-cancel");
    testing.text("#table-data-1-name", `${items[0].name}1Skip`);
    testing.mocks.params.filter = "toget";
    testing.mount(App, routeOptions, ShopItems);
    testing.click("#tab-to-get");
    testing.findAll("tbody tr", 1);
    testing.mocks.params.filter = "incart";
    testing.click("#tab-in-cart");
    testing.mount(App, routeOptions, ShopItems);
    testing.findAll("tbody tr", 2);
    testing.mocks.params.filter = undefined;
    testing.click("#tab-all");
    testing.mount(App, routeOptions, ShopItems);
    testing.findAll("tbody tr", 3);
    testing.mocks.responses.push({});
    testing.mocks.responses.push({});
    testing.click("#button-clear-cart");
    ShopItemState.data(items.slice(0, 1));
    await testing.sleep(100);
    testing.findAll("tbody tr", 1);
  });

  test("store", async () => {
    ShopItemState.data(seed.shopItems);
    testing.mocks.params = {
      store: seed.budgetPayees[1].id,
    };
    testing.mount(App, routeOptions, ShopItems);
    await testing.sleep(100);
    testing.text(
      "#breadcrumbs",
      `home > Shop > Pick Up > ${seed.budgetPayees[1].name}`,
    );
    testing.findAll("tbody tr", 3);
    testing.click("#app-toolbar-action-toggle");
    AuthAccountState.data().primaryAuthHouseholdID = "1";
    testing.click("#dropdown-item-shopitem");
    testing.value("#form-item-select-store", seed.budgetPayees[1].name);

    testing.mocks.params = {
      filter: "incart",
      store: seed.budgetPayees[1].id,
    };
    testing.mount(App, routeOptions, ShopItems);

    testing.findAll("tbody tr", 0);

    expect(document.querySelectorAll(".TableData__draggable")).toHaveLength(0);
  });

  test("list", async () => {
    ShopItemState.data(seed.shopItems);
    testing.mocks.params = {
      list: seed.shopLists[0].id,
    };
    testing.mount(App, routeOptions, ShopItems);

    expect(document.querySelectorAll(".TableData__draggable")).toHaveLength(1);
  });
});
