import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import type { SecretsValueDecrypted } from "../states/SecretsValue";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { FormOverlaySecretsValue } from "./FormOverlaySecretsValue";

test("FormOverlaySecretsValue", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	SecretsVaultState.data(seed.secretsVaults);
	await AuthAccountState.decryptPrivateKeys("");

	SecretsValueState.create = vi.fn(async () => {
		return Promise.resolve({
			...SecretsValueState.new(),
			...{
				id: "1",
			},
		});
	});
	SecretsValueState.delete = vi.fn(async () => {
		return Promise.resolve();
	});
	SecretsValueState.update = vi.fn(async () => {
		return Promise.resolve();
	});

	const t1 = Timestamp.now();
	const t2 = Timestamp.now();
	t2.addMinutes(-60);

	const value: SecretsValueDecrypted = {
		...SecretsValueState.new(),
		...{
			authHouseholdID: seed.authHouseholds[0].id,
			data: [
				{
					test: "test1",
					updated: t1.toString(),
				},
				{
					test: "test2",
					updated: t2.toString(),
				},
			],
			id: "1" as NullUUID,
			name: "Test",
			secretsVaultID: SecretsVaultState.data()[0].id,
			tags: [],
		},
	};

	testing.mount(FormOverlaySecretsValue, {
		data: value,
	});

	// Buttons
	testing.find("#form-update-value");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	await testing.sleep(100);
	expect(SecretsValueState.delete)
		.toBeCalledWith("1");
	testing.click("#button-cancel");
	testing.click("#button-update");
	await testing.sleep(100);
	expect(SecretsValueState.update)
		.toBeCalledTimes(1);
	value.id = null;
	testing.redraw();
	testing.click("#button-add");
	await testing.sleep(100);
	expect(SecretsValueState.create)
		.toBeCalledTimes(1);
	value.id = "1";
	testing.redraw();
	InfoState.data().cloud = false;
	testing.redraw();
	testing.notFind("#button-add");
	InfoState.data().cloud = true;
	testing.redraw();

	// Vault
	const vault = testing.find("#form-item-select-vault");
	testing.findAll(`#${vault.id} option`, SecretsVaultState.names().length);
	testing.input(vault, seed.secretsVaults[0].id);
	testing.value(vault, seed.secretsVaults[0].id);
	expect(value.secretsVaultID)
		.toBe(seed.secretsVaults[0].id);

	// Name
	const name = testing.find("#form-item-input-name");
	testing.input(name, "testing");
	testing.value(name, "testing");
	expect(value.name)
		.toBe("testing");

	// Tags
	const tags = testing.find("#form-item-input-tags");
	testing.findAll("#form-item-datalist-tags option", SecretsValueState.tags().length);
	testing.input(tags, "a ");
	expect(value.tags)
		.toStrictEqual([
			"a",
		]);

	// Version
	testing.findAll("#form-item-select-version option", 3);

	// Fields
	testing.findAll("#form-item-datalist-properties-key-0 option", SecretsValueState.properties().length);
	testing.input("#form-item-input-properties-key-0", "Test");
	expect(value.data[0].Test)
		.toBe("test1");
	testing.redraw();
	testing.input("#form-item-input-properties-value-0", "Test1");
	expect(value.data[0].Test)
		.toBe("Test1");
	testing.notFind("#button-restore");
	testing.input("#form-item-select-version", t2.toString());
	testing.redraw();
	testing.value("#form-item-input-properties-value-0", "test2");
	testing.find("#button-restore");

	// Generator
	testing.notFind("#form-generate-value");
	testing.click("#button-custom-0");
	testing.find("#form-generate-value");
	expect(testing.find("#form-item-input-value").textContent) // eslint-disable-line no-restricted-syntax
		.toHaveLength(12);
	testing.input("#form-item-input-length", "20");
	await testing.sleep(100);
	const v = testing.find("#form-item-input-value").textContent; // eslint-disable-line no-restricted-syntax
	expect(v)
		.toHaveLength(20);
	testing.click("#button-use-value");
	testing.value("#form-item-input-properties-value-0", v as string);

	// Notes
	testing.input("#form-item-text-area-note", "This is a note");
	testing.value("#form-item-text-area-note", "This is a note");
	expect(value.data[2].Note)
		.toBe("This is a note");
});
