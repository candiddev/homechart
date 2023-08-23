import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { FormOverlayCookMealPlan } from "./FormOverlayCookMealPlan";

test("FormOverlayCookMealPlan", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	CookRecipeState.data(seed.cookRecipes);
	CookMealTimeState.data(seed.cookMealTimes);
	CookMealPlanState.create = vi.fn();
	CookMealPlanState.delete = vi.fn();
	CookMealPlanState.update = vi.fn();

	const now = Timestamp.now();

	const cookMealPlan = {
		...CookMealPlanState.new(),
		...{
			cookRecipeID: seed.cookRecipes[0].id,
			date: now.toCivilDate()
				.toJSON(),
			id: "111" as NullUUID,
			time: "12:00",
		},
	};

	testing.mount(FormOverlayCookMealPlan, {
		data: cookMealPlan,
	});

	// Buttons
	testing.find("#form-update-meal-plan");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(CookMealPlanState.delete)
		.toBeCalledTimes(1);
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(CookMealPlanState.update)
		.toBeCalledTimes(1);
	cookMealPlan.id = null;
	testing.redraw();
	testing.click("#button-add");
	expect(CookMealPlanState.create)
		.toBeCalledTimes(1);
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	testing.redraw();

	testing.find("#form-item-owner");
	testing.find("#form-item-input-date");

	const mealList = testing.findAll("#button-array-meal p", seed.cookMealTimes.length);
	testing.click(mealList[2]);
	await testing.sleep(200);
	const dinner = CookMealTimeState.findName(mealList[2].textContent!); // eslint-disable-line no-restricted-syntax

	testing.value("#form-item-input-meal-time", `${dinner.time}`);
	now.timestamp.setHours(parseInt(dinner.time!.split(":")[0], 10));
	now.timestamp.setMinutes(parseInt(dinner.time!.split(":")[1], 10));
	now.addMinutes(seed.cookRecipes[0].timeCook * -1);

	testing.findAll("#form-item-datalist-recipe option", seed.cookRecipes.length);
	testing.hasAttribute("#form-item-input-recipe", "list", "form-item-datalist-recipe");
	testing.find("#button-surprise-me");
	testing.find("#form-item-input-filter-for-tags");
	testing.find("#form-image-image");
	testing.text("#form-item-icons-rating", "starstarstarstar");
	testing.text("#form-item-text-area-ingredients", seed.cookRecipes[0].ingredients.replace(/\n/g, ""));

	testing.value("#form-item-input-send-cook-reminder-at", now.toHTMLDate());
	now.addMinutes(seed.cookRecipes[0].timePrep * -1);
	testing.input("#form-item-input-send-cook-reminder-at", "");
	expect(cookMealPlan.notificationTimeCook).toBeNull;

	testing.value("#form-item-input-send-prep-reminder-at", now.toHTMLDate());

	testing.input("#form-item-input-send-prep-reminder-at", "");
	expect(cookMealPlan.notificationTimeCook).toBeNull;

	testing.input("#form-item-input-filter-for-tags", "apples");
	testing.click("#button-surprise-me");
	testing.value("#form-item-input-recipe", "Apple Pie");
	testing.click("#form-expander-recipe-details");
	testing.notFind("#form-item-icons-rating");
});
