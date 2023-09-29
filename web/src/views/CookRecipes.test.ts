import { App } from "@lib/layout/App";
import { Duration } from "@lib/types/Duration";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { PlanProjectState } from "../states/PlanProject";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopListState } from "../states/ShopList";
import { CookRecipes } from "./CookRecipes";

test("CookRecipes", async () => {
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetPayeeState.data(seed.budgetPayees);
	CookMealTimeState.data(seed.cookMealTimes);
	CookRecipeState.data([
		{
			...seed.cookRecipes[1],
			...{
				deleted: Timestamp.now()
					.toString(),
			},
		},
		seed.cookRecipes[3],
		seed.cookRecipes[0],
	]);
	PlanProjectState.data(seed.planProjects);
	ShopCategoryState.data(seed.shopCategories);
	ShopListState.data(seed.shopLists);

	testing.mount(App, routeOptions, CookRecipes);
	testing.find("#form-item-input-search-table");
	testing.text(`#table-data-${seed.cookRecipes[0].id}-name`, `${seed.cookRecipes[0].name}addtag${seed.cookRecipes[0].tags.join("tag")}`);
	testing.click(`#table-data-${seed.cookRecipes[0].id}-name .GlobalButtonIconAdd`);
	testing.click("#dropdown-item-meal-plan");
	testing.value("#form-item-input-recipe", seed.cookRecipes[0].name);
	testing.click("#button-cancel");
	testing.text(`#table-data-${seed.cookRecipes[0].id}-timecooktimeprep`, Duration.toString(seed.cookRecipes[0].timeCook + seed.cookRecipes[0].timePrep));
	testing.findAll("tbody tr", 2);

	testing.click("#button-show-deleted");
	testing.text(`#table-data-${seed.cookRecipes[1].id}-name`, `${seed.cookRecipes[1].name}addtag${seed.cookRecipes[1].tags.join("tag")}`);
	testing.findAll("tbody tr", 1);
	await testing.sleep(100);
	testing.click("#button-show-deleted");
	await testing.sleep(100);
	testing.findAll("tbody tr", 2);

	testing.click("#button-array-show-tag-coffee");
	await testing.sleep(100);
	testing.text(`#table-data-${seed.cookRecipes[3].id}-name`, `${seed.cookRecipes[3].name}addtag${seed.cookRecipes[3].tags.join("tag")}`);
	testing.findAll("tbody tr", 1);
	testing.click("#button-array-show-tag-coffee");
	await testing.sleep(100);
	testing.findAll("tbody tr", 2);

	testing.input("#form-item-input-table", "espresso");
	await testing.sleep(1200);
	testing.text(`#table-data-${seed.cookRecipes[3].id}-name`, `${seed.cookRecipes[3].name}addtag${seed.cookRecipes[3].tags.join("tag")}`);
	testing.findAll("tbody tr", 1);
	testing.input("#form-item-input-table", "cereal milk");
	await testing.sleep(1200);
	testing.notFind(`#table-data-${seed.cookRecipes[3].id}-name`);
	testing.findAll("tbody tr", 0);
	testing.find("#table-no-data-message");

	testing.click("#app-toolbar-action-toggle");
	testing.click("#dropdown-item-import-recipe-from-website");
	testing.find("#form-item-input-website-address");
	testing.click("#button-cancel");
	await testing.sleep(100);
	testing.click("#app-toolbar-action-toggle");
	testing.click("#dropdown-item-import-recipes-from-csv");
	testing.find("#button-select-csv");
});
