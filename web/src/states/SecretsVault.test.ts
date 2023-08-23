import { Clone } from "@lib/utilities/Clone";

import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { SecretsValueState } from "./SecretsValue";
import { SecretsVaultState } from "./SecretsVault";

describe("SecretsVault", () => {
	test("data", () => {
		SecretsValueState.data([]);
		SecretsVaultState.data(seed.secretsVaults);
		SecretsVaultState.data([]);
	});

	test("keys", async () => {
		expect(Object.keys(SecretsVaultState.keys()))
			.toHaveLength(0);

		AuthAccountState.data(seed.authAccounts[0]);
		await AuthAccountState.decryptPrivateKeys("");
		SecretsVaultState.data(Clone(seed.secretsVaults));
		await testing.sleep(100);

		expect(Object.keys(SecretsVaultState.keys()))
			.toHaveLength(2);
	});

	test("deleteKey", async () => {
		testing.mocks.responses = [
			{
				dataType: "SecretsVault",
				dataValue: [
					seed.secretsVaults[1],
				],
			},
		];

		await SecretsVaultState.deleteKey(seed.secretsVaults[1], seed.authAccounts[0].id);

		testing.requests([
			{
				body: {
					...seed.secretsVaults[1],
					...{
						keys: [
							seed.secretsVaults[1].keys[1],
						],
					},
				},
				method: "PUT",
				path: `/api/v1/secrets/vaults/${seed.secretsVaults[1].id}`,
			},
		]);
	});

	test("setKey", async () => {
		testing.mocks.responses = [
			{
				dataType: "SecretsVault",
				dataValue: [
					seed.secretsVaults[1],
				],
			},
		];

		AuthHouseholdState.data(seed.authHouseholds);

		await SecretsVaultState.setKey(seed.secretsVaults[0], seed.authAccounts[2].id);

		expect((testing.mocks.requests[0].body as any).keys[1].authAccountID)
			.toBe(seed.authAccounts[2].id);
	});
});
