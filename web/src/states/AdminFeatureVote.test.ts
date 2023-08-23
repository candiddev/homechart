import { AdminFeatureVoteState } from "./AdminFeatureVote";

describe("AdminFeatureVoteState", () => {
	test("delete", async () => {
		testing.mocks.responses = [
			{},
		];

		await AdminFeatureVoteState.delete();

		testing.requests([
			{
				method: "DELETE",
				path: "/api/v1/admin/feature-votes",
			},
		]);
	});

	test("read", async () => {
		testing.mocks.responses = [
			{
				dataType: "AuthHouseholdFeatureVotes",
				dataValue: [
					{
						feature: 1,
					},
				],
			},
		];

		await AdminFeatureVoteState.read();

		await testing.sleep(100);

		expect(AdminFeatureVoteState.data())
			.toStrictEqual([
				{
					feature: 1,
				},
			]);

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/admin/feature-votes",
			},
		]);
	});
});
