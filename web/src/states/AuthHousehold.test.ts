import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";

describe("AuthHousehold", () => {
	afterEach(() => {
		testing.mocks.requests = [];
		AuthHouseholdState.reset();
	});

	test("data", () => {
		AuthAccountState.data(seed.authAccounts[0]);
		AuthHouseholdState.data(seed.authHouseholds);

		expect(AuthHouseholdState.members())
			.toHaveLength(6);
		expect(AuthHouseholdState.membersChildren())
			.toHaveLength(1);

		AuthHouseholdState.data([]);
	});

	test("deleteMember", async () => {
		AuthHouseholdState.data([
			seed.authHouseholds[0],
		]);

		testing.mocks.responses = [
			{},
		];

		await AuthHouseholdState.deleteMember(seed.authHouseholds[0].id, "1");

		testing.requests([
			{
				method: "DELETE",
				path: `/api/v1/auth/households/${seed.authHouseholds[0].id}/members/1`,
			},
		]);
	});

	test("findMember/members/name", async () => {
		AuthHouseholdState.data(seed.authHouseholds);

		expect(AuthHouseholdState.findMember(seed.authHouseholds[0].members[0].id))
			.toStrictEqual(
				seed.authHouseholds[0].members[0],
			);
		expect(AuthHouseholdState.findMember(seed.authHouseholds[0].members[1].name))
			.toStrictEqual(
				seed.authHouseholds[0].members[1],
			);
		expect(AuthHouseholdState.findMember(seed.authHouseholds[0].members[2].emailAddress))
			.toStrictEqual(
				seed.authHouseholds[0].members[2],
			);
		expect(AuthHouseholdState.findMember("1"))
			.toStrictEqual(
				AuthHouseholdState.newMember(),
			);

		expect(AuthHouseholdState.findMemberName(seed.authHouseholds[0].members[0].id))
			.toBe(seed.authHouseholds[0].members[0].name);
		expect(AuthHouseholdState.findMemberNames(seed.authHouseholds[0].id))
			.toStrictEqual([
				seed.authHouseholds[0].members[0].name,
				seed.authHouseholds[0].members[2].name,
				seed.authHouseholds[0].members[1].name,
			]);
		expect(AuthHouseholdState.findMemberNames(seed.authHouseholds[0].id, true))
			.toStrictEqual([
				seed.authHouseholds[0].members[0].name,
				seed.authHouseholds[0].members[2].name,
			]);
	});

	test("getPermitted", () => {
		AuthHouseholdState.data(seed.authHouseholds);
		AuthSessionState.data().permissionsHouseholds = [
			{
				authHouseholdID: seed.authHouseholds[0].id,
				permissions: {
					...Permission.new(),
					...{
						auth: 1,
					},
				},
			},
		];

		expect(AuthHouseholdState.getPermitted(PermissionComponentsEnum.Auth, PermissionEnum.None))
			.toStrictEqual([
				seed.authHouseholds[0],
			]);
	});

	test("isExpired", async () => {
		AuthHouseholdState.data(seed.authHouseholds);
		AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
			.toJSON();
		expect(AuthHouseholdState.isExpired(seed.authHouseholds[0].id))
			.toBeTruthy();
		const now = Timestamp.now();
		now.addDays(100);
		AuthHouseholdState.data()[0].subscriptionExpires = now.toCivilDate()
			.toJSON();
		expect(AuthHouseholdState.isExpired(seed.authHouseholds[0].id)).not.toBeTruthy();
	});

	test("isHidden", () => {
		AuthHouseholdState.data(seed.authHouseholds);
		AuthHouseholdState.data()[0].preferences.hideComponents = [
			"Bookmarks",
		];

		expect(AuthHouseholdState.isHidden("Bookmarks"))
			.toBeFalsy();

		AuthHouseholdState.data()[1].preferences.hideComponents = [
			"Bookmarks",
		];

		expect(AuthHouseholdState.isHidden("Bookmarks"))
			.toBeTruthy();
		AuthHouseholdState.data()[0].preferences.hideComponents = [];
		AuthHouseholdState.data()[1].preferences.hideComponents = [];
	});

	test("readAdmin", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthHouseholds",
				dataValue: seed.authHouseholds,
			},
		];

		await AuthHouseholdState.readAdmin("a", 1);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/auth/households?filter=a&offset=1",
			},
		]);
	});

	test("updateHideComponents", async () => {
		AuthHouseholdState.data(seed.authHouseholds);

		testing.mocks.responses = [
			{
				dataType: "AuthHousehold",
				dataValue: [
					{
						...AuthHouseholdState.data()[0],
						...{
							preferences: {
								...AuthHouseholdState.data()[0].preferences,
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

		await AuthHouseholdState.updateHideComponents(seed.authHouseholds[0].id, "health");

		testing.requests([
			{
				body: {
					...AuthHouseholdState.data()[0],
					...{
						preferences: {
							...AuthHouseholdState.data()[0].preferences,
							... {
								hideComponents: [
									"health",
								],
							},
						},
					},
				},
				method: "PUT",
				path: `/api/v1/auth/households/${AuthHouseholdState.data()[0].id}`,
			},
		]);
	});
});
