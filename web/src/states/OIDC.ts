import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import type { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";
import { OIDCProviderType } from "@lib/types/OIDCProviderType";
import m from "mithril";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import { WebGlobalActionSignInFail } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { GlobalState } from "./Global";

interface OIDC {
  action: OIDCAction;
  redirects: string[];
  state: string;
  type: OIDCProviderTypeEnum;
}

interface OIDCRedirect {
  state: string;
  url: string;
}

export enum OIDCAction {
  Unknown,
  SignIn,
  Update,
}

export const OIDCState = {
  data: Stream([] as OIDCProviderTypeEnum[]),
  inResponseProviders: (
    response: APIResponse<unknown>,
  ): response is APIResponse<OIDCProviderTypeEnum[]> => {
    return response.dataType === "OIDCProviders";
  },
  inResponseRedirect: (
    response: APIResponse<unknown>,
  ): response is APIResponse<OIDCRedirect[]> => {
    return response.dataType === "OIDCRedirect";
  },
  is: (value: unknown): value is OIDC => {
    return value !== null;
  },
  load: async (): Promise<OIDC> => {
    return IndexedDB.get("OIDC").then((value) => {
      if (OIDCState.is(value)) {
        return value;
      }

      return {
        action: OIDCAction.Unknown,
        redirects: [],
        source: 0,
        state: "",
        type: 0,
      };
    });
  },
  readProviders: async (force?: boolean): Promise<void> => {
    if (OIDCState.refreshed === false || force === true) {
      OIDCState.refreshed = true;

      return API.read("/api/v1/oidc", {}).then((response) => {
        if (!IsErr(response) && OIDCState.inResponseProviders(response)) {
          OIDCState.data(response.dataValue);

          m.redraw();

          return;
        }

        OIDCState.data([]);
        m.redraw();
      });
    }
  },
  readRedirect: async (
    providerType: OIDCProviderTypeEnum,
  ): Promise<OIDCRedirect | Err> => {
    return API.read(
      `/api/v1/oidc/${OIDCProviderType.values[providerType].toLowerCase()}`,
      {},
    ).then((response) => {
      if (IsErr(response)) {
        return response;
      }

      if (OIDCState.inResponseRedirect(response)) {
        return response.dataValue[0];
      }

      return ErrUnknownResponse;
    });
  },
  readResponse: async (
    code: string,
    providerString: string,
    state: string,
  ): Promise<void> => {
    const provider = parseInt(providerString, 10) as OIDCProviderTypeEnum;
    const data = await OIDCState.load();

    AppState.setSessionRedirect(data.redirects);

    if (data.type !== provider || data.state !== state) {
      AppState.setLayoutAppAlert({
        message: AuthAccountState.translate(WebGlobalActionSignInFail),
      });

      if (data.action === OIDCAction.SignIn) {
        m.route.set("/signin");
      }

      return;
    }

    switch (data.action) {
      case OIDCAction.SignIn:
        const session = {
          ...AuthAccountState.new(),
          ...{
            emailAddress: "oidc@homechart.app",
            oidcCode: code,
            oidcProviderType: data.type,
            subscriptionReferrerCode:
              localStorage.getItem("referral") === null
                ? ""
                : (localStorage.getItem("referral") as string),
            tosAccepted: true,
          },
        };

        return AuthAccountState.createSession(
          session,
          await API.getHostname(),
        ).then(async (err) => {
          if (IsErr(err)) {
            AppState.setLayoutAppAlert(err);
            m.route.set("/signin");

            return;
          }

          return GlobalState.signIn();
        });
      case OIDCAction.Update:
        await AuthAccountState.load();
        return AuthAccountState.update({
          ...AuthAccountState.data(),
          ...{
            emailAddress: "oidc@homechart.app",
            oidcCode: code,
            oidcProviderType: data.type,
          },
        }).then((err) => {
          if (IsErr(err)) {
            AppState.setLayoutAppAlert(err);
          }

          m.route.set("/settings/account");
        });
      case OIDCAction.Unknown:
        NewErr("OIDC.readResponse: unknown action");
    }
  },
  refreshed: false,
  set: async (data: OIDC): Promise<void | Err> => {
    return IndexedDB.set("OIDC", data);
  },
};
