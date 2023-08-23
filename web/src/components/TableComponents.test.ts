import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { TableComponents } from "./TableComponents";

test("TableComponents", async () => {
	const account = seed.authAccounts[0];
	await AuthAccountState.set(account);
	const household = seed.authHouseholds[0];
	AuthHouseholdState.data([
		{
			...household,
			...{
				preferences: {
					...household.preferences,
					...{
						hideComponents: [
							"health",
						],
					},
				},
			},
		},
	]);
	AuthSessionState.data(seed.authSessions[0]);

	testing.mount(TableComponents);

	testing.findAll("#table-components tr", 12);
	testing.text("#table-data-inventory-name", "Inventory");
	testing.text("#table-data-inventory-hidden", "check_box_outline_blank");

	testing.mocks.responses = [
		{
			dataType: "AuthAccount",
			dataValue: [
				{
					...account,
					...{
						preferences: {
							...account.preferences,
							...{
								hideComponents: [
									"inventory",
								],
							},
						},
					},
				},
			],
		},
	];
	testing.click("#table-data-inventory-hidden");
	await testing.sleep(200);
	testing.text("#table-data-inventory-hidden", "check_box");

	testing.mount(TableComponents, {
		authHouseholdID: seed.authHouseholds[0].id,
	});

	testing.findAll("#table-components tr", 13);

	testing.text("#table-data-health-name", "Health");
	testing.text("#table-data-health-hidden", "check_box");

	testing.mocks.responses = [
		{
			dataType: "AuthHousehold",
			dataValue: [
				{
					...household,
					...{
						preferences: {
							...household.preferences,
							...{
								hideComponents: [],
							},
						},
					},
				},
			],
		},
	];
	testing.click("#table-data-health-hidden");
	await testing.sleep(100);
	testing.text("#table-data-health-hidden", "check_box_outline_blank");
});
