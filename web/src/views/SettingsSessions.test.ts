import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import { routeOptions } from "../routes";
import { AuthSessionState } from "../states/AuthSession";
import { SettingsSessions } from "./SettingsSessions";

test("SettingsSessions", async () => {
	const today = Timestamp.now();
	const tomorrow = Timestamp.now();
	tomorrow.addDays(1);

	AuthSessionState.data(
		{
			...AuthSessionState.new(),
			...{
				created: today.toString(),
				expires: tomorrow.toString(),
				id: "1",
				name: "a",
			},
		},
	);

	testing.mocks.responses = [
		{
			dataType: "AuthSessions",
			dataValue: [
				AuthSessionState.data(),
				{
					...AuthSessionState.new(),
					...{
						created: today.toString(),
						expires: tomorrow.toString(),
						id: "2",
						name: "b",
					},
				},
			],
		},
	];
	testing.mount(App, routeOptions, SettingsSessions);
	await testing.sleep(100);
	testing.title("Settings - Sessions");

	testing.text("#table-header-created", "Createdarrow_upward");
	testing.findAll("tbody tr", 2);
	testing.text("#table-data-1-name", "a (this session)");
	testing.text("#table-data-1-created", AppState.formatCivilDate(today.toCivilDate()));
	testing.text("#table-data-1-expires", AppState.formatCivilDate(tomorrow.toCivilDate()));

	// Device access
	const edit = testing.find("#table-row_1");
	testing.click(edit);

	testing.find("#form-item-input-name");
	testing.find("#form-item-input-expires");
	testing.click("#form-expander-personal-permissions");
	testing.notFind("#form-item-select-budget");
	testing.find("#form-item-select-calendar");
});
