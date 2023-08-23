import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { CalendarEventState } from "../states/CalendarEvent";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import type { CalendarDayEventAttrs } from "./CalendarDayEvent";
import { CalendarDayEvent } from "./CalendarDayEvent";

test("CalendarDayEvent", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data([
		seed.authHouseholds[0],
	]);
	CookMealTimeState.data(seed.cookMealTimes);
	CookRecipeState.data(seed.cookRecipes);
	HealthItemState.data(seed.healthItems);
	HealthLogState.data(seed.healthLogs);

	const now = Timestamp.now();
	const e1 = Timestamp.now();
	e1.timestamp.setHours(22);
	e1.timestamp.setMinutes(0);
	const e2 = Timestamp.now();
	e2.timestamp.setHours(11);
	e2.timestamp.setMinutes(40);
	const e3 = Timestamp.now();
	e3.timestamp.setHours(7);
	e3.timestamp.setMinutes(45);
	const e4 = Timestamp.now();
	e4.timestamp.setHours(10);
	e4.timestamp.setMinutes(0);
	const e5 = Timestamp.now();
	e5.timestamp.setHours(22);
	e5.timestamp.setMinutes(0);
	const e6 = Timestamp.now();
	e6.addDays(-1);
	e6.timestamp.setHours(7);
	const e7 = Timestamp.now();
	e7.addDays(1);
	e7.timestamp.setHours(6);

	const event = {
		...CalendarEventState.new(),
		...{
			authAccountID: null,
			authHouseholdID: seed.authHouseholds[0].id,
			color: 2,
			duration: 30,
			name: "Drop kids off",
			participants: [
				seed.authAccounts[0].id,
				"notanid",
			],
			timeStart: "08:00",
			timestampStart: e3.toString(),
			travelTime: 15,
		},
	};

	const attrs = {
		date: now.toCivilDate(),
		event: event,
		loaded: true,
	} as CalendarDayEventAttrs;

	testing.mount(CalendarDayEvent, attrs);

	const item = testing.find(".CalendarDayEvent__item");

	// Test name
	testing.text(`${item.id} span`, "calendar_monthDrop kids off8:00 AM - 8:30 AM");

	// Test participants
	testing.findAll(".CalendarDayEvent__participant", 1);

	// Test time
	testing.text(".CalendarDayEvent__participant", `person${seed.authAccounts[0].name}`);
	testing.text(".CalendarDayEvent__description > p:nth-of-type(2)", "warningLeave by 7:45 AM");

	/// Test form
	testing.click(`${item.id} span`);
	expect(AppState.getLayoutAppForm().data)
		.toStrictEqual(event);

	attrs.loaded = false;
	testing.redraw();

	testing.findAll(".CalendarDayEvent__participant", 0);
	testing.findAll(".CalendarDayEvent__item--loading", 1);
});
