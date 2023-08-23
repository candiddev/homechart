import seed from "../jest/seed";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { InfoState } from "./Info";
import type { PaddleURL } from "./Payment";
import { PaymentState } from "./Payment";

describe("PaymentState", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	InfoState.data({
		...InfoState.data(),
		...{
			cloud: true,
		},
	});


	test("cancel", async () => {
		testing.mocks.responses = [
			{},
		];

		await PaymentState.cancel(seed.authHouseholds[0].id);

		testing.requests([
			{
				body: {
					authHouseholdID: AuthHouseholdState.data()[0].id,
				},
				method: "DELETE",
				path: "/api/v1/payments",
			},
		]);
	});

	test("createPaddle", async () => {
		testing.mocks.responses = [
			{
				dataType: "paddleURL",
				dataValue: [
					{
						url: "1",
					},
				],
			},
		];

		const response = await PaymentState.createPaddle(seed.authHouseholds[0].id,
			AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime,
		);

		testing.requests([
			{
				body: {
					authHouseholdID: seed.authHouseholds[0].id,
					baseURL: "http://localhost",
					emailAddress: seed.authAccounts[0].emailAddress,
					processor: AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime,
				},
				method: "POST",
				path: "/api/v1/payments",
			},
		]);

		expect((response as PaddleURL).url)
			.toBe("1");
	});
});
