import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { FormTableAuthHouseholdMembers } from "./FormTableAuthHouseholdMembers";

test("FormTableAuthHouseholdMembers", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);

	testing.mount(FormTableAuthHouseholdMembers, {
		authHouseholdID: seed.authHouseholds[0].id,
	});

	// Invite
	testing.click("#button-add");
	testing.find("#form-item-email-address");
	testing.click("#button-cancel");
	await testing.sleep(100);
	testing.notFind("#form-item-email-address");

	// Members
	testing.text(`#table-data-${seed.authAccounts[0].id}-name`, seed.authAccounts[0].name);
	testing.text(`#table-data-${seed.authAccounts[0].id}-emailaddress`, seed.authAccounts[0].emailAddress);
	testing.text(`#table-data-${seed.authAccounts[0].id}-owner`, "check_box");
	testing.text(`#table-data-${seed.authAccounts[0].id}-color`, AuthHouseholdState.findMember(seed.authAccounts[0].id, seed.authHouseholds[0].id).color);
	testing.text(`#table-data-${seed.authAccounts[2].id}-child`, "check_box");
	testing.click(`#table-row_${seed.authAccounts[0].id}`);
	testing.find("#form-item-email-address");
	testing.find("#form-item-color");
	testing.text("#form-item-input-email-address", seed.authAccounts[0].emailAddress);
	testing.click("#form-checkbox-input-child");
	testing.notFind("#form-item-input-email-address");

	testing.notFind("#form-item-select-budget");
	testing.click("#form-expander-permissions");
	testing.find("#form-item-select-budget");
});
