import "./Setup.css";

import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { FormItemSelectCurrencyFormat } from "@lib/components/FormItemSelectCurrencyFormat";
import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";

import { FormAuthAccountPreferences } from "../components/FormAuthAccountPreferences";
import { FormJoinHousehold } from "../components/FormJoinHousehold";
import { FormSubscription } from "../components/FormSubscription";
import { FormTableAuthHouseholdMembers } from "../components/FormTableAuthHouseholdMembers";
import { Logo } from "../components/Logo";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectAccount,
  ObjectHousehold,
  WebGlobalActionFinish,
  WebGlobalActionNext,
  WebGlobalActionSetup,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalSubscription,
  WebSetupAlertHousehold,
  WebSetupOverview,
  WebSetupWelcome,
  WebSetupWelcomeTo,
} from "../yaml8n";

export const Setup = (): m.Component => {
  const state = {
    authAccount: AuthAccountState.data(),
    authHousehold: AuthHouseholdState.findID(
      AuthAccountState.data().primaryAuthHouseholdID,
    ),
  };

  AuthHouseholdState.data.map(() => {
    state.authHousehold = Clone(
      AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID),
    );
  });

  return {
    oninit: async (): Promise<void> => {
      switch (m.route.param().target) {
        case "account":
          document.title = `Homechart - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(ObjectAccount)}`;
          break;
        case "household":
          document.title = `Homechart - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(ObjectHousehold)}`;
          break;
        case "subscription":
          document.title = `Homechart - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(WebGlobalSubscription)}`;
          break;
        default:
          document.title = `Homechart - ${AuthAccountState.translate(WebGlobalActionSetup)}`;
      }
    },
    onremove: async (): Promise<void> => {
      return AuthAccountState.load().then(() => {
        m.redraw();
      });
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          buttons: [
            {
              name: AuthAccountState.translate(WebGlobalActionFinish),
              onclick: async (): Promise<void | Err> => {
                AppState.redirect();

                if (!AuthAccountState.data().setup) {
                  return AuthAccountState.update(
                    {
                      ...AuthAccountState.data(),
                      ...{
                        setup: true,
                      },
                    },
                    true,
                  );
                }
              },
              permitted:
                (!AuthAccountState.isDemo() &&
                  !AuthAccountState.data().child &&
                  m.route.param().target !== "subscription") ||
                (AuthAccountState.isDemo() &&
                  m.route.param().target !== "household") ||
                (AuthAccountState.data().child &&
                  m.route.param().target !== "account"),
              requireOnline: true,
            },
            {
              name:
                (AuthAccountState.isDemo() &&
                  m.route.param().target === "household") ||
                (AuthAccountState.data().child &&
                  m.route.param().target === "account") ||
                m.route.param().target === "subscription"
                  ? AuthAccountState.translate(WebGlobalActionFinish)
                  : AuthAccountState.translate(WebGlobalActionNext),
              permitted: true,
              requireOnline: true,
              submit: true,
            },
          ],
          onsubmit: async () => {
            switch (m.route.param().target) {
              case "account":
                await AuthAccountState.update(state.authAccount, true);

                if (AuthAccountState.data().child) {
                  AppState.redirect();
                } else {
                  m.route.set(
                    "/setup/household",
                    {},
                    {
                      state: {
                        key: Date.now(),
                      },
                    },
                  );
                }
                break;
              case "household":
                if (AuthHouseholdState.data().length === 0) {
                  AppState.setLayoutAppAlert({
                    message: AuthAccountState.translate(WebSetupAlertHousehold),
                  });

                  return;
                }
                await AuthHouseholdState.update(state.authHousehold, true);

                if (!AuthAccountState.isDemo()) {
                  if (!AuthAccountState.data().setup) {
                    await AuthAccountState.update(
                      {
                        ...AuthAccountState.data(),
                        ...{
                          setup: true,
                        },
                      },
                      true,
                    );
                  }

                  m.route.set(
                    "/setup/subscription",
                    {},
                    {
                      state: {
                        key: Date.now(),
                      },
                    },
                  );
                  break;
                }
              case "subscription": // eslint-disable-line no-fallthrough
                AppState.redirect();

                return AuthAccountState.update(
                  {
                    ...AuthAccountState.data(),
                    ...{
                      setup: true,
                    },
                  },
                  true,
                );
              default:
                m.route.set(
                  "/setup/account",
                  {},
                  {
                    state: {
                      key: Date.now(),
                    },
                  },
                );
                break;
            }
          },
          progressCurrent:
            m.route.param().target === "account"
              ? 1
              : m.route.param().target === "household"
                ? 2
                : m.route.param().target === "subscription"
                  ? 3
                  : 0,
          progressSteps: [
            ...[
              {
                link: "/setup",
                name: AuthAccountState.translate(WebSetupWelcome),
              },
              {
                link: "/setup/account",
                name: `1 - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(ObjectAccount)}`,
              },
            ],
            ...(AuthAccountState.data().child
              ? []
              : [
                  {
                    link: "/setup/household",
                    name: `2 - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(ObjectHousehold)}`,
                  },
                ]),
            ...(AuthAccountState.isDemo() || AuthAccountState.data().child
              ? []
              : [
                  {
                    disabled: AuthHouseholdState.data().length === 0,
                    link: "/setup/subscription",
                    name: `3 - ${AuthAccountState.translate(WebGlobalActionSetup)} ${AuthAccountState.translate(WebGlobalSubscription)}`,
                  },
                ]),
          ],
        },
        m.route.param().target === "account"
          ? m(FormAuthAccountPreferences, {
              authAccount: state.authAccount,
            })
          : m.route.param().target === "household"
            ? AuthSessionState.data().permissionsHouseholds === null ||
              AuthSessionState.data().permissionsHouseholds!.length === 0 // eslint-disable-line @typescript-eslint/no-non-null-assertion
              ? m(FormJoinHousehold, {
                  add: true,
                  onjoin: (household) => {
                    state.authHousehold = Clone(household);

                    m.redraw();
                  },
                })
              : [
                  m(FormItem, {
                    input: {
                      oninput: (e) => {
                        state.authHousehold.name = e;
                      },
                      type: "text",
                      value: state.authHousehold.name,
                    },
                    name: AuthAccountState.translate(WebGlobalName),
                    tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
                  }),
                  m(FormItemSelectCurrencyFormat, {
                    oninput: (e) => {
                      state.authHousehold.preferences.currency = e;
                    },
                    permitted: GlobalState.permitted(
                      PermissionComponentsEnum.Auth,
                      true,
                      state.authHousehold.id,
                    ),
                    value: state.authHousehold.preferences.currency,
                  }),
                  m(FormTableAuthHouseholdMembers, {
                    authHouseholdID:
                      AuthAccountState.data().primaryAuthHouseholdID,
                    nameEmailOnly: true,
                  }),
                ]
            : m.route.param().target === "subscription"
              ? m(FormSubscription, {
                  authHouseholdID:
                    AuthAccountState.data().primaryAuthHouseholdID,
                })
              : m("div.Setup#welcome", [
                  m(Logo, {
                    noTitle: true,
                  }),
                  m(
                    "p.Setup__welcome",
                    `${AuthAccountState.translate(WebSetupWelcomeTo)} Homechart`,
                  ),
                  m(
                    "p.Setup__overview",
                    AuthAccountState.translate(WebSetupOverview),
                  ),
                ]),
      );
    },
  };
};
