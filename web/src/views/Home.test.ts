import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BookmarkState } from "../states/Bookmark";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import { CalendarEventState } from "../states/CalendarEvent";
import { ChangeState } from "../states/Change";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { TableNotifyOperationEnum } from "../types/TableNotify";
import { Home } from "./Home";

test("Home", async () => {
	const now = Timestamp.now();

	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);

	BookmarkState.data(seed.bookmarks);
	BudgetAccountState.data(seed.budgetAccounts);
	BudgetPayeeState.data(seed.budgetPayees);
	BudgetRecurrenceState.data(seed.budgetRecurrences);
	CalendarEventState.data(seed.calendarEvents);
	ChangeState.data([
		{
			authAccountID: seed.authAccounts[0].id,
			authHouseholdID: seed.authHouseholds[0].id,
			created: null,
			id: "1",
			name: "Something",
			operation: TableNotifyOperationEnum.Create,
			tableName: "plan_task",
			updated: now.toString(),
		},
	]);
	CookRecipeState.data(seed.cookRecipes);
	CookMealTimeState.data(seed.cookMealTimes);
	CookMealPlanState.data(seed.cookMealPlans);
	PlanProjectState.data(seed.planProjects);
	PlanTaskState.data(seed.planTasks);

	testing.mount(Home, {});

	expect(document.title)
		.toBe("");

	expect(testing.findAll(".CalendarDayEvent__item").length)
		.toBeGreaterThan(1);

	testing.findAll(".Home__bookmarks-button", 5);

	testing.text(document.querySelectorAll(".TableData")[1], "Jane added a Plan > Task:Something");
});
