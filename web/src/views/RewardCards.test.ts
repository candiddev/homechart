import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { RewardCardState } from "../states/RewardCard";
import { RewardCards } from "./RewardCards";

describe("RewardCards", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);

  RewardCardState.data([
    {
      ...RewardCardState.new(),
      ...{
        details: "details 1",
        id: "1",
        name: "card 1",
        recipients: [seed.authAccounts[1].id],
        reward: "reward 1",
        senders: [seed.authAccounts[0].id],
        stampCount: 2,
        stampGoal: 2,
      },
    },
    {
      ...RewardCardState.new(),
      ...{
        id: "2",
        invert: true,
        name: "card 2",
        recipients: [seed.authAccounts[0].id],
        reward: "reward 2",
        senders: [seed.authAccounts[1].id],
        stampCount: 2,
        stampGoal: 5,
      },
    },
    {
      ...RewardCardState.new(),
      ...{
        details: "details 2",
        id: "3",
        name: "card 3",
        recipients: [seed.authAccounts[0].id],
        reward: "reward 3",
        senders: [seed.authAccounts[1].id],
        stampCount: 4,
        stampGoal: 5,
      },
    },
    {
      ...RewardCardState.new(),
      ...{
        details: "details 4",
        id: "4",
        name: "card 4",
        reward: "reward 4",
        senders: [seed.authAccounts[0].id],
        stampCount: 1,
        stampGoal: 2,
      },
    },
  ]);

  test("sent", async () => {
    testing.mocks.params.filter = "sent";
    testing.mount(RewardCards);

    testing.hasClass("#tab-doe-family", "Title__tab--active");

    testing.findAll(".Form", 2);

    testing.mocks.params.to = seed.authAccounts[1].id;
    testing.mount(RewardCards);

    testing.findAll(".Form", 1);

    testing.text(".Form .Title", "check_circle_outlinecard 1editEdit");
    testing.find("#button-redeem");
    testing.find("#button-reset");
    testing.findAll(".RewardCards__field", 4);
    testing.findAll(".RewardCards__stamp", 2);
    testing.findAll(".RewardCards__stamp--stamped", 2);
  });

  test("inprogress", async () => {
    testing.mocks.params.filter = "inprogress";
    testing.mount(RewardCards);

    testing.findAll(".Form", 2);

    testing.text(".Form .Title", "assignmentcard 3editEdit");
    testing.findAll(".Form:first-of-type .RewardCards__stamp", 5);
    testing.findAll(".Form:first-of-type .RewardCards__stamp--stamped", 4);
  });

  test("redeemable", async () => {
    testing.mocks.params.filter = "redeemable";
    testing.mount(RewardCards);

    testing.findAll(".Form", 1);
    testing.text(".Form .Title", "check_circle_outlinecard 2editEdit");
  });

  test("form", async () => {
    testing.mocks.params.filter = "sent";
    testing.mocks.params.to = seed.authAccounts[1].id;
    testing.mount(App, routeOptions, RewardCards);

    testing.findAll(".Form", 1);

    testing.click("#button-edit");
    testing.find("#button-delete");
    testing.find("#button-update");
    testing.click("#button-cancel");
  });

  test("none", async () => {
    RewardCardState.data([]);
    testing.mount(App, routeOptions, RewardCards);

    testing.findAll(".Form", 1);

    const empty = testing.find(".RewardCards__empty");

    testing.text(empty, "No Cards found");
    testing.text("#button-new-card", "addNew Card");

    testing.click("#button-new-card");
    testing.find("#button-add");
  });
});
