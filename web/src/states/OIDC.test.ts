import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { OIDCAction, OIDCState } from "./OIDC";

describe("OIDCState", () => {
	test("load/set", async () => {
		const input = {
			action: OIDCAction.Update,
			redirects: [
				"/settings/account",
			],
			referrer: "1",
			state: "1",
			type: OIDCProviderTypeEnum.Test,
		};
		await OIDCState.set(input);

		const state = await OIDCState.load();

		expect(state)
			.toStrictEqual(input);
	});

	test("readProviders", async () => {
		testing.mocks.responses = [
			{
				dataType: "OIDCProviders",
				dataValue: [
					OIDCProviderTypeEnum.Google,
				],
			},
		];

		await OIDCState.readProviders();

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/oidc",
			},
		]);

		expect(OIDCState.data())
			.toStrictEqual([
				OIDCProviderTypeEnum.Google,
			]);
	});

	test("readRedirect", async () => {
		const data = [
			{
				state: "something",
				url: "https://homechart.app",
			},
		];

		testing.mocks.responses = [
			{
				dataType: "OIDCRedirect",
				dataValue: data,
			},
		];

		const redirect = await OIDCState.readRedirect(OIDCProviderTypeEnum.Test);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/oidc/test",
			},
		]);

		expect(redirect)
			.toStrictEqual(data[0]);
	});

	test("readResponse - SignIn", async () => {
		const state = UUID.new() as string;

		localStorage.setItem("referral", "1");

		await OIDCState.set({
			action: OIDCAction.SignIn,
			redirects: [
				"/auth/settings",
			],
			state: state,
			type: OIDCProviderTypeEnum.Test,
		});

		testing.mocks.responses = [
			{
				dataType: "AuthSession",
				dataValue: [
					seed.authSessions[0],
				],
			},
			{
				dataType: "Info",
				dataValue: [
					{
						cloud: true,
					},
				],
			},
			{
				dataType: "AuthSession",
				dataValue: [
					seed.authSessions[0],
				],
			},
			{
				dataType: "AuthAccount",
				dataValue: [
					seed.authAccounts[0],
				],
			},
			{
				dataType: "AuthHouseholds",
				dataValue: [
					seed.authHouseholds[0],
				],
			},
		];

		await OIDCState.readResponse("code", "1", state);

		const account = {
			...AuthAccountState.new(),
			...{
				emailAddress: "oidc@homechart.app",
				oidcCode: "code",
				oidcProviderType: 1,
				subscriptionReferrerCode: "1",
				tosAccepted: true,
			},
		};

		testing.requests([
			{
				body: account,
				method: "POST",
				path: "/api/v1/auth/signin",
			},
			{
				method: "GET",
				path: "/api?p=firefox",
			},
			{
				method: "GET",
				path: "/api/v1/auth/signin",
			},
			{
				method: "GET",
				path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
			},
		]);
	});

	test("readResponse - Update", async () => {
		const state = UUID.new() as string;

		AuthAccountState.data(seed.authAccounts[0]);
		AuthHouseholdState.reset();

		await OIDCState.set({
			action: OIDCAction.Update,
			redirects: [
				"/auth/settings",
			],
			state: state,
			type: OIDCProviderTypeEnum.Test,
		});

		testing.mocks.responses = [
			{
				dataType: "AuthAccount",
				dataValue: [
					seed.authAccounts[0],
				],
			},
		];

		await OIDCState.readResponse("code", "1", state);

		const account = {
			...AuthAccountState.data(),
			...{
				emailAddress: "oidc@homechart.app",
				oidcCode: "code",
				oidcProviderType: 1,
			},
		};

		testing.requests([
			{
				body: {
					...account,
				},
				method: "PUT",
				path: `/api/v1/auth/accounts/${AuthAccountState.data().id}`,
			},
		]);
	});
});
