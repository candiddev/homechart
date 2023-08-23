import { CivilDate } from "@lib/types/CivilDate";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { PaymentState } from "../states/Payment";
import { FormSubscription } from "./FormSubscription";

describe("FormSubscription", () => {
	AuthAccountState.data(seed.authAccounts[3]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthHouseholdState.data()[1].subscriptionReferralCount = 3;
	AuthHouseholdState.data()[0].subscriptionReferralCount = 3;
	AuthSessionState.data(seed.authSessions[3]);
	PaymentState.prices().monthly = "$3.00";

	test("cloud", async () => {
		InfoState.data().cloud = true;

		testing.mocks.responses = [
			{
				dataType: "AuthHousehold",
				dataValue: [
					seed.authHouseholds[1],
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					seed.authHouseholds[1],
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					seed.authHouseholds[1],
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					seed.authHouseholds[1],
				],
			},
		];

		testing.mount(FormSubscription, {
			authHouseholdID: seed.authHouseholds[1].id,
		});

		testing.text("#form-item-input-subscription-expires", CivilDate.fromString(seed.authHouseholds[1].subscriptionExpires)
			.toString(seed.authAccounts[3].preferences.formatDateOrder, seed.authAccounts[3].preferences.formatDateSeparator));

		testing.input("#form-item-input-referrer-code", "123");
		await testing.sleep(500);
		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						subscriptionReferrerCode: "123",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
		]);

		testing.input("#form-item-input-your-referral-code", "123");
		await testing.sleep(500);
		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						subscriptionReferralCode: "123",
						subscriptionReferrerCode: "123",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
		]);
		testing.text("#referral", "You've referred 3 so far.  Refer 7 more to subscribe to Homechart and receive a free lifetime subscription!  The users you refer get a free month.  Here's a link for social media: https://web.homechart.app/signup?referral=123");

		testing.mocks.requests = [];
		testing.input("#form-item-input-self-hosted-id", "test");
		await testing.sleep(500);
		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						selfHostedID: "test",
						subscriptionReferralCode: "123",
						subscriptionReferrerCode: "123",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
		]);

		testing.input("#form-item-input-self-hosted-id", "");
		await testing.sleep(500);
		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						selfHostedID: null,
						subscriptionReferralCode: "123",
						subscriptionReferrerCode: "123",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
		]);

		testing.find("#button-subscribe-monthly-300");
	});

	test("not cloud", async () => {
		InfoState.data().cloud = false;

		testing.mocks.responses = [
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
						},
					},
				],
			},
		];

		testing.mount(FormSubscription, {
			authHouseholdID: seed.authHouseholds[1].id,
		});

		testing.text("#form-item-input-self-hosted-id", seed.authHouseholds[1].id);

		testing.find("#button-copy-id-and-visit-homechart-cloud");
		testing.click("#button-retry-link");

		await testing.sleep(500);
		testing.requests([
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}`,
			},
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}`,
			},
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}/jwt`,
			},
		]);
		testing.text("#form-item-input-subscription-expires", CivilDate.fromString(seed.authHouseholds[1].subscriptionExpires)
			.toString(seed.authAccounts[3].preferences.formatDateOrder, seed.authAccounts[3].preferences.formatDateSeparator));
	});
});
