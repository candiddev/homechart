import type { EncryptedValue } from "@lib/encryption/Encryption";
import { Key, KeyTypeNone, KeyTypeRSA2048Private, NewKey } from "@lib/encryption/Encryption";
import { IsErr } from "@lib/services/Log";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { IndexedDB } from "../services/IndexedDB";
import type { AuthAccount } from "./AuthAccount";
import { AuthAccountPrivateKeyProviderNone, AuthAccountPrivateKeyProviderPasswordPBKDF2, AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";

describe("Authccount", () => {
	afterEach(async () => {
		testing.mocks.requests = [];
		AuthAccountState.reset();
	});

	test("data", () => {
		AuthAccountState.data(seed.authAccounts[0]);
		expect(AuthAccountState.keys())
			.toBe(seed.authAccounts[0].privateKeys);
		AuthAccountState.data(AuthAccountState.new());
	});


	test("collapseNotesPage", async () => {
		const id = UUID.new();

		AuthAccountState.data().collapsedNotesPages = [
			UUID.new() as string,
			UUID.new() as string,
			id as string,
		];

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					AuthAccountState.data(),
				],
			},
		];

		await AuthAccountState.collapseNotesPage(id);

		expect(AuthAccountState.data().collapsedNotesPages).not.toContain(id);
	});

	test("collapsePlanProject", async () => {
		const id = UUID.new();

		AuthAccountState.data().collapsedPlanProjects = [
			UUID.new() as string,
			UUID.new() as string,
		];

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					AuthAccountState.data(),
				],
			},
		];

		await AuthAccountState.collapsePlanProject(id);

		expect(AuthAccountState.data().collapsedPlanProjects)
			.toContain(id);
	});

	test("collapsePlanTask", async () => {
		const id = UUID.new();

		AuthAccountState.data().collapsedPlanTasks = [
			UUID.new() as string,
			UUID.new() as string,
			id as string,
		];

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					AuthAccountState.data(),
				],
			},
		];

		await AuthAccountState.collapsePlanTask(id);

		expect(AuthAccountState.data().collapsedPlanTasks).not.toContain(id);
	});

	test("createAuthAccount", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthSession",
				dataValue: [
					{
						...AuthSessionState.new(),
						...{
							admin: true,
						},
					},
				],
			},
		];

		const account = {
			...AuthAccountState.data(),
		};

		await AuthAccountState.createAccount(account, "");

		testing.requests([
			{
				body: account,
				method: "POST",
				path: "/api/v1/auth/accounts",
			},
		]);

		expect(account.privateKeys.length)
			.toBe(0);
		expect(AuthSessionState.data().admin)
			.toBeTruthy();

		account.password = "hello";

		await AuthAccountState.createAccount(account, "");

		expect(account.privateKeys.length)
			.toBe(1);

		AuthAccountState.data(account);
		await AuthAccountState.decryptPrivateKeys("hello", true);

		expect(AuthAccountState.privateKey().key).not.toBe("");
		expect(await IndexedDB.get("AuthAccountPrivateKey")).not.toBe(null);
	});

	test("createReset", async () => {
		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.createReset(AuthAccountState.data());

		testing.requests([
			{
				body: AuthAccountState.data(),
				method: "POST",
				path: "/api/v1/auth/reset",
			},
		]);
	});

	test("createSession", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthSession",
				dataValue: [
					{
						...AuthSessionState.new(),
						...{
							id: "1",
						},
					},
				],
			},
		];

		await AuthAccountState.createSession(
			{
				...AuthAccountState.new(),
				...{
					emailAddress: "jane@example.com",
					password: "jane@example.com",
				},
			},
			"",
		);

		testing.requests([
			{
				body: {
					...AuthAccountState.new(),
					...{
						emailAddress: "jane@example.com",
						password: "jane@example.com",
					},
				},
				method: "POST",
				path: "/api/v1/auth/signin",
			},
		]);

		expect(AuthSessionState.data().id)
			.toBe("1");
	});

	test("createTOTP", async () => {
		AuthAccountState.data().id = UUID.new();

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					{
						...AuthAccountState.data(),
						...{
							totpQR: "Not an image",
						},
					},
				],
			},
		];

		const response = await AuthAccountState.createTOTP();

		testing.requests([
			{
				method: "POST",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}/totp`,
			},
		]);

		expect(IsErr(response) ?
			"" :
			response.totpQR)
			.toBe("Not an image");
	});

	test("decryptPrivateKeys/loadPrivateKey/newPrivateKeyPBKDF2/savePrivateKey", async () => {
		const keys = await NewKey(KeyTypeRSA2048Private) as {
			privateKey: Key,
			publicKey: Key,
		};
		AuthAccountState.privateKey(keys.privateKey);

		AuthAccountState.data({
			...AuthAccountState.data(),
			...{
				privateKeys: [
					{
						key:
					await AuthAccountState.newPrivateKeyPBKDF2("password") as string,
						name: "Testing",
						provider: AuthAccountPrivateKeyProviderPasswordPBKDF2,
					},
					{
						key: ((await new Key(KeyTypeNone, "", "")
							.encrypt(keys.privateKey.string())) as EncryptedValue).string(),
						name: "Testing",
						provider: AuthAccountPrivateKeyProviderNone,
					},
				],
			},
		});

		await IndexedDB.delete("AuthAccountPrivateKey");
		AuthAccountState.privateKey(new Key("", "", ""));

		await AuthAccountState.decryptPrivateKeys("password");

		expect(AuthAccountState.privateKey())
			.toStrictEqual(keys.privateKey);

		AuthAccountState.privateKey(new Key("", "", ""));

		await AuthAccountState.decryptPrivateKeys("");

		expect(AuthAccountState.privateKey())
			.toStrictEqual(keys.privateKey);

		await AuthAccountState.savePrivateKey();

		AuthAccountState.privateKey(new Key("", "", ""));

		AuthAccountState.data().privateKeys = [];
		await IndexedDB.delete("AuthAccountPrivateKey");

		await AuthAccountState.decryptPrivateKeys("");

		expect(AuthAccountState.privateKey())
			.toStrictEqual(new Key("", "", ""));
	});

	test("deletePrivateKey/updatePrivatePublicKey", async () => {
		AuthAccountState.data({
			...seed.authAccounts[0],
			...{
				privateKeys: [
					seed.authAccounts[0].privateKeys[0],
					{
						key: "a",
						name: "b",
						provider: AuthAccountPrivateKeyProviderNone,
					},
				],
			},
		});

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					seed.authAccounts[0],
				],
			},
		];

		await AuthAccountState.deletePrivateKey("b");

		testing.requests([
			{
				body: seed.authAccounts[0],
				method: "PUT",
				path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}/keys`,
			},
		]);

		await IndexedDB.clear();
	});

	test("findNotificationsHousehold", () => {
		AuthAccountState.data().preferences.notificationsHouseholds = [
			{
				...AuthAccountState.newNotificationsHouseholds(),
				...{
					authHouseholdID: "1",
					ignoreDeviceCalendarEvent: false,
				},
			},
		];

		expect(AuthAccountState.findNotificationsHousehold(AuthAccountState.data().preferences.notificationsHouseholds, "1"))
			.toStrictEqual(AuthAccountState.data().preferences.notificationsHouseholds![0]);
	});

	test("deleteICalendarID", async () => {
		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.deleteICalendarID();

		testing.requests([
			{
				method: "DELETE",
				path: "/api/v1/icalendar",
			},
		]);
	});

	test("deleteSessions", async () => {
		AuthAccountState.data().id = UUID.new();

		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.deleteSessions();

		testing.requests([
			{
				method: "DELETE",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}/sessions`,
			},
		]);
	});

	test("deleteSessions", async () => {
		AuthAccountState.data().id = UUID.new();

		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.deleteSessions();

		testing.requests([
			{
				method: "DELETE",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}/sessions`,
			},
		]);
	});

	test("isDemo", () => {
		expect(AuthAccountState.isDemo())
			.toBeFalsy();
	});

	test("newPrivatePublicKey", async () => {
		AuthAccountState.data(seed.authAccounts[0]);

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					seed.authAccounts[0],
				],
			},
		];

		await IndexedDB.clear();

		await AuthAccountState.newPrivatePublicKey("testing", "Password");

		const key = AuthAccountState.privateKey();

		const a = testing.mocks.requests[0].body as AuthAccount;

		expect(a.publicKey)
			.not.toBe(seed.authAccounts[0].privateKeys);
		expect(a.privateKeys)
			.not.toBe(seed.authAccounts[0].publicKey);

		AuthAccountState.privateKey(new Key("", "", ""));
		AuthAccountState.data(a);
		await AuthAccountState.decryptPrivateKeys("Password");

		expect(AuthAccountState.privateKey())
			.toStrictEqual(key);
	});

	test("readAll", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthAccounts",
				dataValue: [
					{
						...AuthAccountState.data(),
						...{
							id: UUID.new(),
						},
					},
					{
						...AuthAccountState.data(),
						...{
							id: UUID.new(),
						},
					},
					{
						...AuthAccountState.data(),
						...{
							id: UUID.new(),
						},
					},
				],
			},
		];

		const response = await AuthAccountState.readAll("j", 50);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/auth/accounts?filter=j&offset=50",
			},
		]);

		expect(IsErr(response) ?
			[] :
			response.dataValue)
			.toHaveLength(3);
	});

	test("readTOTPBackup", async () => {
		AuthAccountState.data().id = UUID.new();

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					{
						...AuthAccountState.data(),
						...{
							totpBackup: "000000",
						},
					},
				],
			},
		];

		const response = await AuthAccountState.readTOTPBackup();

		testing.requests([
			{
				method: "GET",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}/totp`,
			},
		]);

		expect(response)
			.toBe("000000");
	});

	test("readVerify", async () => {
		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.readVerify();

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/auth/verify",
			},
		]);
	});

	test("set", async () => {
		await AuthAccountState.set({
			...AuthAccountState.new(),
			...({
				preferences: {
					formatTime24: true,
				},
			} as AuthAccount),
		});

		expect(AuthAccountState.data())
			.toStrictEqual({
				...AuthAccountState.new(),
				...{
					preferences: {
						...AuthAccountState.new().preferences,
						...{
							formatTime24: true,
						},
					},
				},
			});
	});

	test("setPrivateKey", async () => {
		AuthAccountState.data(seed.authAccounts[0]);

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					seed.authAccounts[0],
				],
			},
		];

		const key = {
			key: "1",
			name: "2",
			provider: AuthAccountPrivateKeyProviderNone,
		};

		await AuthAccountState.setPrivateKey(key);

		expect((testing.mocks.requests[0].body as AuthAccount).privateKeys[1])
			.toStrictEqual(key);

	});

	test("updateHideComponents", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					{
						...AuthAccountState.data(),
						...{
							preferences: {
								...AuthAccountState.data().preferences,
								... {
									hideComponents: [
										"health",
									],
								},
							},
						},
					},
				],
			},
		];

		await AuthAccountState.updateHideComponents("health");

		testing.requests([
			{
				body: {
					...AuthAccountState.data(),
					...{
						preferences: {
							...AuthAccountState.data().preferences,
							... {
								hideComponents: [
									"health",
								],
							},
						},
					},
				},
				method: "PUT",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}`,
			},
		]);
	});

	test("updateICalendarID", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					{
						...AuthAccountState.new(),
						...{
							icalendarID: "1",
						},
					},
				],
			},
		];

		await AuthAccountState.updateICalendarID();

		testing.requests([
			{
				method: "PUT",
				path: "/api/v1/icalendar",
			},
		]);

		expect(AuthAccountState.data().icalendarID)
			.toBe("1");
	});

	test("updateReset", async () => {
		const token = UUID.new();

		testing.mocks.responses = [
			{},
		];

		await AuthAccountState.updateReset({
			...AuthAccountState.data(),
			...{
				password: "password",
				passwordResetToken: token,
			},
		});

		testing.requests([
			{
				body: {
					...AuthAccountState.data(),
					...{
						password: "password",
						passwordResetToken: token,
					},
				},
				method: "PUT",
				path: "/api/v1/auth/reset",
			},
		]);
	});

	test("updateTOTP", async () => {
		AuthAccountState.data().id = UUID.new();

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					AuthAccountState.data(),
				],
			},
		];

		await AuthAccountState.updateTOTP({
			...AuthAccountState.data(),
			...{
				totpSecret: "secret",
			},
		});

		testing.requests([
			{
				body: {
					...AuthAccountState.data(),
					...{
						totpSecret: "secret",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}/totp`,
			},
		]);
	});

	test("updateVerify", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					AuthAccountState.data(),
				],
			},
		];

		const id1 = UUID.new();
		const id2 = UUID.new();

		await AuthAccountState.updateVerify(id1 as string, id2 as string);

		testing.requests([
			{
				body: {},
				method: "PUT",
				path: `/api/v1/auth/verify?id=${id1}&token=${id2}`,
			},
		]);
	});
});
