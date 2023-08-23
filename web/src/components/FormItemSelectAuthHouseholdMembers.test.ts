import seed from "../jest/seed";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { FormItemSelectAuthHouseholdMembersAttrs } from "./FormItemSelectAuthHouseholdMembers";
import { FormItemSelectAuthHouseholdMembers } from "./FormItemSelectAuthHouseholdMembers";

describe("FormItemSelectAuthHouseholdMembers", () => {
	test("single", async () => {
		const attrs = {
			authHouseholdID: seed.authHouseholds[0].id,
			members: [
				null as NullUUID,
			],
			name: "Participants",
			oninput: (e: any) => {
				attrs.members[0] = e;
			},
			tooltip: "Hello",
		} as FormItemSelectAuthHouseholdMembersAttrs;
		AuthHouseholdState.data(seed.authHouseholds);

		testing.mount(FormItemSelectAuthHouseholdMembers, attrs);

		const array = testing.findAll("#button-array-participants > p", seed.authHouseholds[0].countMembers);
		testing.click(array[0]);
		testing.click(array[1]);
		expect(attrs.members[0])
			.toBe(seed.authHouseholds[0].members[1].id);
		testing.click(array[1]);
		expect(attrs.members[0])
			.toBeNull();
	});
	test("multiple", async () => {
		const attrs = {
			authHouseholdID: seed.authHouseholds[0].id,
			members: [],
			multiple: true,
			name: "Participants",
			oninput: (e: any) => {
				attrs.members = e;
			},
			tooltip: "Hello",
		} as FormItemSelectAuthHouseholdMembersAttrs;
		AuthHouseholdState.data(seed.authHouseholds);

		testing.mount(FormItemSelectAuthHouseholdMembers, attrs);

		const array = testing.findAll("#button-array-participants > p", seed.authHouseholds[0].countMembers);
		testing.click(array[0]);
		testing.click(array[1]);
		expect(attrs.members)
			.toHaveLength(2);
	});
});
