import { AppState } from "@lib/states/App";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { FormContactUs } from "./FormContactUs";

describe("FormContactUs", () => {
	test("cloud, online and authenticated", async () => {
		AppState.setSessionAuthenticated(true);
		AuthAccountState.data(seed.authAccounts[0]);
		AuthHouseholdState.data(seed.authHouseholds);
		AuthSessionState.data(seed.authSessions[0]);
		InfoState.data().cloud = true;

		testing.mocks.responses = [
			{},
		];

		testing.mount(FormContactUs);

		testing.notFind("#support");
		testing.notFind("#button-cancel");
		testing.notFind("#button-submit");
		testing.click("#button-help");
		testing.find("#button-send");
		testing.click("#button-cancel");
		testing.click("#button-feedback");
		testing.value("#form-item-input-email-address", seed.authAccounts[0].emailAddress);
		testing.input("#form-item-text-area-message", "write more tests");
		testing.click("#button-send");
		await testing.sleep(100);
		testing.requests([
			{
				body: {
					authHouseholdID: seed.authHouseholds[0].id,
					emailAddress: seed.authAccounts[0].emailAddress,
					message: "write more tests",
					type: 1,
					url: "http://localhost/",
				},
				method: "POST",
				path: "/api/v1/contact",
			},
		]);
	});

	test("not authenticated", async () => {
		InfoState.data().cloud = false;
		AppState.setSessionAuthenticated(false);
		testing.mount(FormContactUs);
		testing.find("#support");
	});
});
