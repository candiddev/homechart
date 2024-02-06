import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";

import { API } from "../services/API";
import { ObjectMessageSent } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { InfoState } from "./Info";

export interface Contact {
  authHouseholdID?: NullUUID;
  emailAddress: string;
  message: string;
  selfHostedID?: NullUUID;
  type: number;
  url: string;
}

export const ContactState = {
  create: async (data: Contact): Promise<void | Err> => {
    data.url = window.location.href;

    if (InfoState.data().cloud) {
      data.authHouseholdID = AuthAccountState.data().primaryAuthHouseholdID;
    } else {
      data.selfHostedID = AuthAccountState.data().primaryAuthHouseholdID;
    }

    return API.create("/api/v1/contact", data).then((err) => {
      if (IsErr(err)) {
        AppState.setLayoutAppAlert(err);

        return err;
      }

      AppState.setLayoutAppAlert({
        message: AuthAccountState.translate(ObjectMessageSent),
      });

      return;
    });
  },
  new: (): Contact => {
    return {
      emailAddress: "",
      message: "",
      type: 0,
      url: "",
    };
  },
};
