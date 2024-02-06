import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import Stream from "mithril/stream";

import { API } from "../services/API";
import type { AuthHouseholdFeatureVote } from "./AuthHousehold";
import { AuthHouseholdState } from "./AuthHousehold";

export const AdminFeatureVoteState = {
  data: Stream<AuthHouseholdFeatureVote[]>([]),
  delete: async (): Promise<void | Err> => {
    return API.delete("/api/v1/admin/feature-votes").then((err) => {
      if (IsErr(err)) {
        return err;
      }

      AppState.setLayoutAppAlert({
        message: "Feature Votes Deleted",
      });

      return;
    });
  },
  read: async (): Promise<void | Err> => {
    return API.read("/api/v1/admin/feature-votes", {}).then((response) => {
      if (IsErr(response)) {
        return response;
      }

      if (AuthHouseholdState.inResponseFeatureVotes(response)) {
        AdminFeatureVoteState.data(response.dataValue);
      }

      return;
    });
  },
};
