import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { InfoState } from "../states/Info";
import { FeatureVoting } from "./FeatureVoting";

// Test selector
describe("FeatureVoting", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthHouseholdState.data()[0].featureVotes = [
    {
      amount: 2,
      comment: "test",
      feature: 1,
    },
  ];

  InfoState.data().featureVotes = ["a", "b", "c"];

  test("Admin", async () => {
    AppState.setSessionAdmin(true);
    testing.mocks.responses = [
      {
        dataType: "AuthHouseholdFeatureVotes",
        dataValue: [
          {
            amount: 20,
            comment: "comment",
            feature: 0,
          },
          {
            amount: 10,
            comment: "comment",
            feature: 1,
          },
        ],
      },
    ];

    testing.mount(App, routeOptions, FeatureVoting);
    await testing.sleep(100);
    testing.title("Feature Voting");
    testing.findAll("tbody tr", 3);
    testing.text("#table-data-a-description", "a");
    testing.text("#table-data-a-amount", "20");
    testing.text("#table-data-a-comment", "comment");
    testing.find("#button-delete");
  });

  test("Not Admin", async () => {
    AppState.setSessionAdmin(false);
    AuthHouseholdState.data()[0].featureVotes = [
      {
        amount: 3,
        comment: "",
        feature: 0,
      },
    ];
    testing.mount(FeatureVoting, {});
    testing.title("Feature Voting");
    testing.findAll("tbody tr", 3);
    testing.text("#table-data-a-description", "a");
    testing.text("#table-data-a-amount", "star".repeat(3));
    testing.text("#table-data-a-comment", "");
    testing.click("#table-row_b");
    testing.text("#form-item-input-description", "b");
    testing.text("#form-item-icons-votes", "star_border".repeat(2));
    testing.input("#form-item-text-area-comments", "test");
    testing.find("#button-update");
  });
});
