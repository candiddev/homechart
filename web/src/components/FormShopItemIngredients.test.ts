import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookRecipeState } from "../states/CookRecipe";
import { ShopCategoryState } from "../states/ShopCategory";
import { FormShopItemIngredients } from "./FormShopItemIngredients";

test("FormShopItemIngredients", async () => {
  const input = {
    cookMealPlans: seed.cookMealPlans,
    toggle: (): void => {
      input.visible = !input.visible;
    },
    visible: true,
  };
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetPayeeState.data(seed.budgetPayees);
  CookRecipeState.data(seed.cookRecipes);
  ShopCategoryState.data(seed.shopCategories);
  testing.mount(FormShopItemIngredients, input);
  await testing.sleep(100);
  const rows = testing.findAll("tbody tr", 40);
  const id = rows[0].id.split("_")[1];
  testing.text(`#table-data-${id}-add`, "check_box");
  testing.click(`#table-data-${id}-add`);
  await testing.sleep(200);
  testing.text(`#table-data-${id}-add`, "check_box_outline_blank");
  testing.text(
    `#table-data-${id}-name`,
    "1 1/2 cup all-purpose flour (plus more for rolling)",
  );
  testing.text(
    `#table-data-${id}-shopcategoryid`,
    seed.shopCategories[10].name,
  );
  testing.text(`#table-data-${id}-cookrecipeid`, seed.cookRecipes[1].name);
  testing.find("#button-add-item");
  testing.find("#button-add-selected-items-to-pick-up");
  testing.click(`#table-ingredients-row_${id}`);
  testing.find("#form-item-input-name");
  testing.findAll(
    "#form-item-select-category option",
    seed.shopCategories.length + 1,
  );
  testing.findAll("#form-item-select-store option", 6);
});
