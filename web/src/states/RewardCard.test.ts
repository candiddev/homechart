import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { RewardCardState } from "./RewardCard";

describe("RewardCardState", () => {
  test("data", () => {
    RewardCardState.data(seed.rewardCards);
    RewardCardState.data([]);
  });

  test("getters", () => {
    AuthAccountState.data(seed.authAccounts[0]);
    AuthHouseholdState.data(seed.authHouseholds);

    RewardCardState.data([
      {
        ...RewardCardState.new(),
        ...{
          senders: [seed.authAccounts[0].id],
        },
      },
      {
        ...RewardCardState.new(),
        ...{
          recipients: [seed.authAccounts[1].id],
          senders: [seed.authAccounts[0].id],
        },
      },
      {
        ...RewardCardState.new(),
        ...{
          invert: true,
          senders: [seed.authAccounts[1].id],
          stampCount: 0,
          stampGoal: 5,
        },
      },
      {
        ...RewardCardState.new(),
        ...{
          invert: true,
          senders: [seed.authAccounts[1].id],
          stampCount: 5,
          stampGoal: 5,
        },
      },
      {
        ...RewardCardState.new(),
        ...{
          senders: [seed.authAccounts[1].id],
          stampCount: 0,
          stampGoal: 5,
        },
      },
      {
        ...RewardCardState.new(),
        ...{
          senders: [seed.authAccounts[1].id],
          stampCount: 5,
          stampGoal: 5,
        },
      },
    ]);

    expect(RewardCardState.findSent(RewardCardState.data()).length).toBe(2);
    expect(
      RewardCardState.findSent(RewardCardState.data(), seed.authAccounts[1].id)
        .length,
    ).toBe(1);
    expect(RewardCardState.findSent(RewardCardState.data(), "3").length).toBe(
      0,
    );
    expect(RewardCardState.getInProgress(RewardCardState.data()).length).toBe(
      1,
    );
    expect(RewardCardState.getRedeemable(RewardCardState.data()).length).toBe(
      2,
    );
  });

  test("punch", async () => {
    testing.mocks.responses = [
      {
        dataType: "RewardCard",
        dataValue: [RewardCardState.new()],
      },
    ];

    await RewardCardState.punch({
      ...RewardCardState.new(),
    });

    await RewardCardState.punch({
      ...RewardCardState.new(),
      ...{
        stampCount: 5,
        stampGoal: 6,
      },
    });

    testing.requests([
      {
        body: {
          ...RewardCardState.new(),
          ...{
            stampCount: 6,
            stampGoal: 6,
          },
        },
        method: "PUT",
        path: "/api/v1/reward/cards/null",
      },
    ]);
  });
});
