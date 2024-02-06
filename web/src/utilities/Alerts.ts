import { AppState } from "@lib/states/App";
import m from "mithril";

import {
  Translate,
  WebAlertOffline,
  WebAlertOnline,
  WebAlertPurchase,
  WebAlertSubscriptionExpired1,
  WebAlertSubscriptionExpired2,
  WebAlertSubscriptionExpiring1,
  WebAlertSubscriptionExpiring2,
  WebAlertSubscriptionNeeded,
  WebGlobalActionSubscribe,
} from "../yaml8n";

export const Alerts = {
  code: "en",
  offline: (): void => {
    if (AppState.data.sessionOnline) {
      AppState.set({
        sessionOnline: false,
      });

      AppState.setLayoutAppAlert({
        message: Translate(Alerts.code, WebAlertOffline),
      });
    }
  },
  online: (): void => {
    if (!AppState.data.sessionOnline) {
      AppState.clearLayoutAppAlert(Translate(Alerts.code, WebAlertOffline));
      AppState.setLayoutAppAlert({
        message: Translate(Alerts.code, WebAlertOnline),
      });
      AppState.set({
        sessionOnline: true,
      });
    }
  },
  purchase: (): void => {
    AppState.setLayoutAppAlert({
      message: Translate(Alerts.code, WebAlertPurchase),
    });
  },
  subscriptionExpired: (expirationDate: string): void => {
    const msg = `${Translate(Alerts.code, WebAlertSubscriptionExpired1)} ${expirationDate}.  ${Translate(Alerts.code, WebAlertSubscriptionExpired2)}`;

    AppState.setLayoutAppAlert({
      actions: [
        {
          name: Translate(Alerts.code, WebGlobalActionSubscribe),
          onclick: async (): Promise<void> => {
            AppState.clearLayoutAppAlert(msg);

            m.route.set("/subscription");
          },
        },
      ],
      message: msg,
      persist: true,
    });
  },
  subscriptionExpiring: (expirationDate: string): void => {
    AppState.setLayoutAppAlert({
      actions: [
        {
          name: Translate(Alerts.code, WebGlobalActionSubscribe),
          onclick: async (): Promise<void> => {
            m.route.set("/subscription");
          },
        },
      ],
      message: `${Translate(Alerts.code, WebAlertSubscriptionExpiring1)} ${expirationDate}.  ${Translate(Alerts.code, WebAlertSubscriptionExpiring2)}`,
    });
  },
  subscriptionNeeded: (): void => {
    AppState.setLayoutAppAlert({
      actions: [
        {
          name: "Subscribe",
          onclick: async (): Promise<void> => {
            m.route.set("/subscription");
          },
        },
      ],
      message: Translate(Alerts.code, WebAlertSubscriptionNeeded),
    });
  },
};
