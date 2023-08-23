import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { ResetPassword } from "./ResetPassword";

test("ResetPassword", async () => {
	const token = UUID.new();
	testing.mocks.params = {
		email: seed.authAccounts[0].emailAddress,
		token: token,
	};
	testing.mount(ResetPassword, {});
	expect(document.title)
		.toBe("");
	const buttonReset = testing.find("#button-reset-password");
	const emailAddress = testing.find("#form-item-input-email-address");
	const password = testing.find("#form-item-input-new-password");
	const passwordConfirm = testing.find("#form-item-input-confirm-new-password");
	testing.find("#button-resend");
	testing.find("#form-checkbox-input-show-password");
	testing.hasAttribute(password, "type", "password");
	testing.hasAttribute(passwordConfirm, "type", "password");
	testing.input(emailAddress, "something@example.com");
	testing.input(password, "AGoodPassword");
	testing.input(passwordConfirm, "AGoodPassword");
	testing.mocks.responses = [
		{
			dataType: "AuthAccount",
			dataValue: [
				{
					...AuthAccountState.new(),
					...{
						setup: true,
					},
				},
			],
		},
		{
			dataType: "AuthSession",
			dataValue: [
				AuthSessionState.new(),
			],
		},
		{
			dataValue: [
				{
					cloud: true,
				},
			],
		},
		{
			dataType: "AuthSession",
			dataValue: [
				AuthSessionState.new(),
			],
		},
		{
			dataType: "AuthAccount",
			dataValue: [
				{
					...AuthAccountState.new(),
					...{
						setup: true,
					},
				},
			],
		},
		{
			dataType: "AuthHouseholds",
			dataValue: [
				AuthHouseholdState.new(),
			],
		},
		{
			dataType: "FCM",
			dataValue: [
				{
					appID: "app",
				},
			],
		},
	];
	testing.click(buttonReset);
	await testing.sleep(100);
	expect(testing.mocks.requests[0])
		.toStrictEqual({
			body: {
				...AuthAccountState.new(),
				...{
					emailAddress: seed.authAccounts[0].emailAddress,
					password: "AGoodPassword",
					passwordResetToken: token,
				},
			},
			method: "PUT",
			path: "/api/v1/auth/reset",
		});
	await testing.sleep(100);
	expect(testing.mocks.route)
		.toBe("/home");
});
