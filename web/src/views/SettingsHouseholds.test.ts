import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { SettingsHouseholds } from "./SettingsHouseholds";

test("SettingsHouseholds", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);

	testing.mount(SettingsHouseholds);

	testing.findAll("tbody tr", 2);

	testing.find("#button-join-household");
	testing.text(`#table-data-${seed.authHouseholds[0].id}-name`, seed.authHouseholds[0].name);
	testing.text(`#table-data-${seed.authHouseholds[0].id}-countmembers`, `${seed.authHouseholds[0].countMembers}`);
	testing.text(`#table-data-${seed.authHouseholds[0].id}-primary`, "check_box");
	testing.click(`#table-row_${seed.authHouseholds[0].id}`);
	expect(testing.mocks.route)
		.toBe(`/settings/households/${seed.authHouseholds[0].id}`);
});
