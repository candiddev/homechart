import { CivilDate } from "@lib/types/CivilDate";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import type { SecretsVault } from "../states/SecretsVault";
import { SecretsVaultState } from "../states/SecretsVault";
import { FormOverlaySecretsVault } from "./FormOverlaySecretsVault";

test("FormOverlaySecretsVault", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	await AuthAccountState.decryptPrivateKeys("");
	SecretsVaultState.data(seed.secretsVaults);

	SecretsVaultState.create = vi.fn(async () => {
		return Promise.resolve({
			...SecretsVaultState.new(),
			...{
				id: "1",
			},
		});
	});
	SecretsVaultState.delete = vi.fn(async () => {
		return Promise.resolve();
	});
	SecretsVaultState.update = vi.fn(async () => {
		return Promise.resolve();
	});

	const vault: SecretsVault = {
		...SecretsVaultState.new(),
		...{
			id: "1",
			keys: [
				{
					authAccountID: seed.authAccounts[0].id,
					key: "1",
				},
			],
		},
	};

	testing.mount(FormOverlaySecretsVault, {
		data: vault,
	});

	// Buttons
	testing.find("#form-update-vault");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	await testing.sleep(100);
	expect(SecretsVaultState.delete)
		.toBeCalledWith("1");
	testing.click("#button-cancel");
	testing.click("#button-update");
	await testing.sleep(100);
	expect(SecretsVaultState.update)
		.toBeCalledTimes(1);
	vault.keys = [];
	testing.mount(FormOverlaySecretsVault, {
		data: vault,
	});
	testing.notFind("#button-delete");
	testing.notFind("#button-update");
	vault.id = null;
	testing.mount(FormOverlaySecretsVault, {
		data: vault,
	});
	testing.click("#button-add");
	await testing.sleep(100);
	expect(SecretsVaultState.create)
		.toBeCalledTimes(1);
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	testing.redraw();

	// Household
	testing.find("#form-item-owner");
	testing.click(`#button-array-owner-${seed.authHouseholds[0].id}`);

	// Name
	testing.input("#form-item-input-name", "Test1");
	testing.value("#form-item-input-name", "Test1");
	expect(vault.name)
		.toBe("Test1");

	// Icon
	testing.input("#form-item-input-icon", "icon");
	testing.value("#form-item-input-icon", "icon");
	expect(vault.icon)
		.toBe("icon");

	// Member
	testing.find("#button-array-household-access-jennifer");
});
