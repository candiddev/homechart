import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import { ObjectHouseholdUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import type { AuthHousehold } from "./AuthHousehold";
import { AuthHouseholdState } from "./AuthHousehold";

export const CloudHouseholdState = {
  create: async (
    authHouseholdID: NullUUID,
    emailAddress: string,
    password: string,
  ): Promise<void | Err> => {
    return API.create(`/api/v1/cloud/${authHouseholdID}`, {
      emailAddress: emailAddress,
      password: password,
    }).then((err) => {
      if (IsErr(err)) {
        AppState.setLayoutAppAlert(err);

        return err;
      }

      return;
    });
  },
  data: Stream([] as AuthHousehold[]),
  findID: (authHouseholdID: NullUUID): AuthHousehold => {
    const i = CloudHouseholdState.data().findIndex((household) => {
      return household.selfHostedID === authHouseholdID;
    });

    if (i < 0) {
      return AuthHouseholdState.new();
    }

    return CloudHouseholdState.data()[i];
  },
  isExpired(authHouseholdID?: NullUUID): boolean {
    if (authHouseholdID === undefined) {
      return false;
    }

    const ah = CloudHouseholdState.findID(authHouseholdID);
    return (
      ah.subscriptionExpires === null ||
      CivilDate.fromString(ah.subscriptionExpires) <= CivilDate.now()
    ); // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },
  read: async (authHousheoldID: NullUUID): Promise<void | Err> => {
    return API.read(`/api/v1/cloud/${authHousheoldID}`, {}).then((response) => {
      if (IsErr(response)) {
        return response;
      }

      if (AuthHouseholdState.containsResponse(response)) {
        CloudHouseholdState.set(response.dataValue[0]);

        return;
      }

      return ErrUnknownResponse;
    });
  },
  readJWT: async (authHousheoldID: NullUUID): Promise<void | Err> => {
    return API.read(`/api/v1/cloud/${authHousheoldID}/jwt`, {}).then(
      (response) => {
        if (IsErr(response)) {
          return response;
        }

        if (AuthHouseholdState.containsResponse(response)) {
          AuthHouseholdState.set(response.dataValue[0]);

          return;
        }

        return ErrUnknownResponse;
      },
    );
  },
  set: (authHousehold: AuthHousehold): void => {
    const ah = CloudHouseholdState.data();

    const i = ah.findIndex((household) => {
      return household.id === authHousehold.id;
    });

    if (i < 0) {
      CloudHouseholdState.data([...ah, authHousehold]);
    } else {
      ah[i] = authHousehold;
      CloudHouseholdState.data(ah);
    }
  },
  update: async (data: AuthHousehold): Promise<void | Err> => {
    return API.update(`/api/v1/cloud/${data.id}`, data).then((response) => {
      if (IsErr(response)) {
        AppState.setLayoutAppAlert(response);

        return response;
      }

      if (AuthHouseholdState.containsResponse(response)) {
        CloudHouseholdState.set(response.dataValue[0]);

        AppState.setLayoutAppAlert({
          message: AuthAccountState.translate(ObjectHouseholdUpdated),
        });

        return;
      }

      return;
    });
  },
};
