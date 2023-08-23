import type { EncryptedValue } from "@lib/encryption/Encryption";
import { ParseEncryptedValue } from "@lib/encryption/Encryption";

import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import type { SecretsValue, SecretsValueDecrypted } from "./SecretsValue";
import { SecretsValueState } from "./SecretsValue";
import { SecretsVaultState } from "./SecretsVault";

describe("SecretsValue", () => {
	test("data", () => {
		SecretsValueState.data(seed.secretsValues);
		SecretsValueState.data([]);
	});

	test("names/tags/tagNames/values/properties/encryptValue/findName/getValue", async () => {
		AuthAccountState.data(seed.authAccounts[0]);
		await AuthAccountState.decryptPrivateKeys("");
		SecretsVaultState.data(seed.secretsVaults);
		SecretsValueState.data(seed.secretsValues);
		await testing.sleep(100);

		expect(SecretsValueState.names())
			.toHaveLength(4);
		expect(SecretsValueState.names()[3])
			.toBe("Mom's Garage Code");

		expect(SecretsValueState.tags())
			.toHaveLength(7);
		expect(SecretsValueState.tags()[0])
			.toStrictEqual({
				count: 2,
				name: "app",
			});
		expect(SecretsValueState.tagNames())
			.toHaveLength(7);
		expect(SecretsValueState.tagNames()[6])
			.toBe("person");

		expect(Object.keys(SecretsValueState.values()))
			.toHaveLength(seed.secretsValues.length);
		expect(SecretsValueState.values()[seed.secretsValues[3].id])
			.toStrictEqual({
				authHouseholdID: seed.authHouseholds[0].id,
				data: [
					{
						SSN: "xxx-yy-zzzz",
					},
				],
				name: "Jennifer Doe",
				secretsVaultID: seed.secretsValues[3].secretsVaultID,
				tags: [
					"person",
					"id",
				],
				updated: SecretsValueState.values()[seed.secretsValues[3].id].updated,
			});

		expect(SecretsValueState.properties())
			.toHaveLength(6);
		expect(SecretsValueState.properties()[5])
			.toBe("SSN");

		// encryptValue
		const s: SecretsValueDecrypted = {
			...seed.secretsValues[3],
			...{
				authHouseholdID: seed.authHouseholds[0].id,
				data: [
					{
						test: "test",
						updated: seed.secretsValues[3].updated,
					},
				],
				name: "testing",
				tags: [
					"a",
					"b",
				],
			},
		};

		const se = await SecretsValueState.encryptValue(s) as SecretsValue;

		expect(se?.dataEncrypted)
			.toHaveLength(2);
		expect(se.id)
			.toBe(seed.secretsValues[3].id);
		expect(se.secretsVaultID)
			.toBe(seed.secretsValues[3].secretsVaultID);
		expect(await (ParseEncryptedValue(se.nameEncrypted) as EncryptedValue).decrypt(SecretsVaultState.keys()[se.secretsVaultID as string]))
			.toBe("testing");

		// findName
		expect(SecretsValueState.findName("Jennifer Doe").id)
			.toBe(seed.secretsValues[3].id);
	});
});
