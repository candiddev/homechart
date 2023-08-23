import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import { InfoState } from "../states/Info";
import { FormOverlayHealthLogs } from "./FormOverlayHealthLogs";

test("FormOverlayHealthLogs", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	HealthItemState.data(seed.healthItems);
	HealthLogState.create = vi.fn();
	HealthLogState.delete = vi.fn();
	HealthLogState.update = vi.fn();

	const healthLogs = {
		authAccountID: seed.authAccounts[0].id,
		date: CivilDate.now()
			.toJSON(),
		id: "1",
		logs: [
			{
				...HealthLogState.new(),
				...{
					authAccountID: seed.authAccounts[0].id,
					created: "notadate",
					date: CivilDate.now()
						.toJSON(),
					id: "notanid",
				},
			},
		],
	};

	testing.mount(FormOverlayHealthLogs, {
		data: healthLogs,
	});

	// Buttons
	testing.find("#form-update-logs");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(HealthLogState.delete)
		.toBeCalledWith("notanid");
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(HealthLogState.update)
		.toBeCalledTimes(1);
	InfoState.data().cloud = false;
	testing.redraw();
	testing.notFind("#button-add");
	InfoState.data().cloud = true;
	testing.redraw();

	// Household Member
	testing.find("#button-array-household-member");
	testing.click("#button-array-household-member-jennifer");
	expect(healthLogs.logs)
		.toHaveLength(0);

	// Timestamp
	const later = Timestamp.now();
	later.addDays(2);
	testing.input("#form-item-input-date", later.toCivilDate()
		.toJSON());

	// Inputs
	testing.click("#button-add-input");
	expect(healthLogs.logs[0].date)
		.toBe(later.toCivilDate()
			.toJSON());
	testing.findAll("#form-item-inputs option", 21)!;
	testing.input(`#form-item-input-inputs-${healthLogs.logs[0].id}`, seed.healthItems[3].name);
	expect(healthLogs.logs[0].healthItemID)
		.toBe(seed.healthItems[3].id);
	await testing.sleep(100);
	testing.click("#button-add-input");
	expect(healthLogs.logs[1].nameInput)
		.toBe("");
	testing.input(`#form-item-input-inputs-${healthLogs.logs[1].id}`, "test1");
	expect(healthLogs.logs[1].nameInput)
		.toBe("test1");

	testing.click("#button-add-output");
	testing.findAll("#form-item-inputs .FormItem__multi", 2);
	testing.findAll("#form-item-outputs .FormItem__multi", 1);
	testing.findAll("#form-item-outputs option", 19);
	expect(healthLogs.logs[2].nameOutput)
		.toBe("");
	testing.input(`#form-item-input-outputs-${healthLogs.logs[2].id}`, "test2");
	expect(healthLogs.logs[2].nameOutput)
		.toBe("test2");
});
