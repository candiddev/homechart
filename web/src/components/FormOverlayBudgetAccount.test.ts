import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetAccountState } from "../states/BudgetAccount";
import { InfoState } from "../states/Info";
import { FormOverlayBudgetAccount } from "./FormOverlayBudgetAccount";

test("FormOverlayBudgetAccount", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetAccountState.create = vi.fn();
	BudgetAccountState.delete = vi.fn();
	BudgetAccountState.update = vi.fn();

	const budgetAccount = {
		...BudgetAccountState.new(),
		...{
			id: UUID.new(),
		},
	};

	testing.mount(FormOverlayBudgetAccount, {
		data: budgetAccount,
	});

	// Buttons
	testing.find("#form-update-account");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(BudgetAccountState.delete)
		.toBeCalledWith(budgetAccount.id);
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(BudgetAccountState.update)
		.toBeCalled();
	budgetAccount.id = null;
	testing.redraw();
	testing.click("#button-add");
	expect(BudgetAccountState.create)
		.toBeCalled();
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	InfoState.data().cloud = true;
	testing.redraw();

	testing.find("#form-item-owner");

	testing.input("#form-item-input-name", "Name");
	expect(budgetAccount.name)
		.toBe("Name");

	testing.input("#form-item-input-icon", "Icon");
	expect(budgetAccount.icon)
		.toBe("Icon");

	testing.click("#form-checkbox-input-on-budget");
	expect(budgetAccount.budget)
		.not.toEqual(BudgetAccountState.new().budget);

	testing.click("#form-checkbox-input-hidden");
	expect(budgetAccount.hidden)
		.toBeTruthy();
});
