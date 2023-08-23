import { App } from "@lib/layout/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CloudBackupState } from "../states/CloudBackup";
import { CloudHouseholdState } from "../states/CloudHousehold";
import { InfoState } from "../states/Info";
import { PaymentState } from "../states/Payment";
import { Subscription } from "./Subscription";

describe("Subscription", () => {
	AuthAccountState.data(seed.authAccounts[3]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[3]);

	test("cloud", async () => {
		InfoState.data().cloud = true;

		PaymentState.prices().monthly = "$3.00";

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
		];

		testing.mount(Subscription, {});

		testing.title("Subscription");

		testing.click("#form-checkbox-input-enable-cloud-voice-assistant-proxy");
		testing.value("#form-item-input-self-hosted-address", "");
		testing.input("#form-item-input-self-hosted-address", "test");
		await testing.sleep(500);
		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						selfHostedURL: "test",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
		]);
		testing.click("#form-checkbox-input-enable-cloud-voice-assistant-proxy");
		await testing.sleep(100);
		testing.notFind("#form-item-input-self-hosted-address");
	});

	test("not cloud", async () => {
		testing.mocks.requests = [];
		InfoState.data().cloud = false;

		AuthHouseholdState.data()[0].backupEncryptionKey = "";
		CloudHouseholdState.data([
			{
				...seed.authHouseholds[1],
				...{
					selfHostedID: seed.authHouseholds[1].id,
				},
			},
		]);

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
							backupEncryptionKey: "secret!",
						},
					},
				],
			},
			{
				dataType: "CloudBackups",
				dataValue: [],
			},
			{},
			{
				dataType: "CloudBackups",
				dataValue: [
					{
						...CloudBackupState.new(),
						...{
							created: Timestamp.now()
								.toString(),
							id: "1",
						},
					},
				],
			},
		];

		testing.mount(App, routeOptions, Subscription);

		// Test enabling backups
		testing.notFind("#form-item-input-backup-encryption-key");
		testing.click("#form-checkbox-input-enable-cloud-backups");
		testing.input("#form-item-input-backup-encryption-key", "secret!");
		await testing.sleep(600);
		testing.redraw();
		testing.requests([
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}`,
			},
			{
				body: {
					...seed.authHouseholds[1],
					...{
						backupEncryptionKey: "secret!",
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${seed.authHouseholds[1].id}`,
			},
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}/backups`,
			},
		]);
		testing.findAll("tbody tr", 0);
		testing.click("#button-new-backup");
		await testing.sleep(500);
		testing.requests([
			{
				method: "POST",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}/backups`,
			},
			{
				method: "GET",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}/backups`,
			},
		]);
		testing.findAll("tbody tr", 1);

		testing.mocks.responses = [
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...seed.authHouseholds[1],
						...{
							selfHostedID: seed.authHouseholds[1].id,
							selfHostedURL: "http://localhost",
						},
					},
				],
			},
		];
		testing.notFind("#form-item-input-self-hosted-address");
		testing.click("#form-checkbox-input-enable-cloud-voice-assistant-proxy");
		await testing.sleep(500);
		testing.find("#form-item-input-self-hosted-address");

		testing.requests([
			{
				body: {
					...seed.authHouseholds[1],
					...{
						backupEncryptionKey: "",
						selfHostedID: seed.authHouseholds[1].id,
						selfHostedURL: "http://localhost",
					},
				},
				method: "PUT",
				path: `/api/v1/cloud/${seed.authHouseholds[1].id}`,
			},
		]);
	});
});
