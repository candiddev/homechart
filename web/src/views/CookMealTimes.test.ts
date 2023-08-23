import { App } from "@lib/layout/App";
import { CivilTime } from "@lib/types/CivilTime";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookMealTimes } from "./CookMealTimes";

test("CookMealTimes", async () => {
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	CookMealTimeState.loading = 1;
	CookMealTimeState.set(seed.cookMealTimes);
	testing.mount(App, routeOptions, CookMealTimes);
	testing.title("Cook - Meal Times");
	testing.text("#table-header-time", "Timearrow_downwardfilter_alt");
	testing.findAll("tbody tr", seed.cookMealTimes.length);
	testing.text(`#table-data-${seed.cookMealTimes[3].id}-name`, seed.cookMealTimes[3].name);
	testing.text(`#table-data-${seed.cookMealTimes[3].id}-time`, CivilTime.fromString(seed.cookMealTimes[3].time)
		.toString(false));
	const edit = testing.find(`#table-row_${seed.cookMealTimes[3].id}`);
	testing.click(edit);
	testing.input("#form-item-input-name", "111");
	testing.text(`#table-data-${seed.cookMealTimes[3].id}-name`, seed.cookMealTimes[3].name);
	testing.click("#button-delete");
	testing.mocks.responses.push({});
	testing.click("#button-confirm-delete");
	CookMealTimeState.data(seed.cookMealTimes.slice(1, 3));
	await testing.sleep(100);
	testing.redraw();
	testing.notFind("#button-cancel");
	testing.findAll("tbody tr", 2);
});
