import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { PlanTaskState } from "../states/PlanTask";
import { PermissionComponentsEnum } from "../types/Permission";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";

test("FormItemSelectAuthHousehold", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	const input = PlanTaskState.new();

	testing.mount(FormItemSelectAuthHousehold, {
		item: input,
		permissionComponent: PermissionComponentsEnum.Plan,
	});

	const doe = testing.find(`#button-array-owner-${seed.authHouseholds[0].id}`);
	const smith = testing.find(`#button-array-owner-${seed.authHouseholds[1].id}`);
	const personal = testing.find(`#button-array-owner-${seed.authAccounts[0].id}`);

	testing.notHasClass(personal, "ButtonArray__selected");
	testing.hasClass(doe, "ButtonArray__selected");
	testing.notHasClass(smith, "ButtonArray__selected");

	testing.click(smith);
	expect(input.authAccountID)
		.toBeNull();
	expect(input.authHouseholdID)
		.toBe(seed.authHouseholds[1].id);

	testing.notHasClass(personal, "ButtonArray__selected");
	testing.notHasClass(doe, "ButtonArray__selected");
	testing.hasClass(smith, "ButtonArray__selected");

	testing.click(personal);
	expect(input.authAccountID)
		.toBe(seed.authAccounts[0].id);
	expect(input.authHouseholdID)
		.toBe(null);

	testing.hasClass(personal, "ButtonArray__selected");
	testing.notHasClass(doe, "ButtonArray__selected");
	testing.notHasClass(smith, "ButtonArray__selected");
});
