import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import { FormItemSelectCurrencyFormat } from "@lib/components/FormItemSelectCurrencyFormat";
import { AppState } from "@lib/states/App";
import {
  ActionCancel,
  ActionDelete,
  ActionDeleteConfirm,
  ActionUpdate,
  FormItemSelectColorName,
} from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";
import { fetch } from "whatwg-fetch";

import { FormTableAuthHouseholdMembers } from "../components/FormTableAuthHouseholdMembers";
import { TableComponents } from "../components/TableComponents";
import { apiEndpoint } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthAccountAuthHouseholdState } from "../states/AuthAccountAuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { InfoState } from "../states/Info";
import { SSEState } from "../states/SSE";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectHousehold,
  ObjectHouseholds,
  ObjectMealPlan,
  ObjectMembers,
  ObjectRecurringTransaction,
  ObjectTask,
  WebGlobalActionLeaveHousehold,
  WebGlobalHideComponents,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalPreferences,
  WebGlobalSettings,
  WebSettingsHouseholdExportHousehold,
  WebSettingsHouseholdImportHousehold,
} from "../yaml8n";

enum confirmation {
  None,
  Leave,
  Delete,
}

enum tabs {
  preferences,
  members,
  components,
}

export function SettingsHouseholdsID(): m.Component {
  const state = {
    authHousehold: AuthHouseholdState.new(),
    confirm: confirmation.None,
    tab: tabs.preferences,
  };

  let stream = Stream();

  return {
    onbeforeremove: (): void => {
      stream.end(true);
    },
    oninit: (): void => {
      stream = AuthHouseholdState.data.map(() => {
        state.authHousehold = AuthHouseholdState.findID(m.route.param().id);

        AppState.setLayoutApp({
          ...GetHelp("settings#household-settings"),
          breadcrumbs: [
            {
              link: "/settings/account",
              name: AuthAccountState.translate(WebGlobalSettings),
            },
            {
              link: "/settings/households",
              name: AuthAccountState.translate(ObjectHouseholds),
            },
            {
              name: state.authHousehold.name,
            },
          ],
          toolbarActionButtons: [],
        });
      }) as Stream<unknown>;
    },
    view: (): m.Children => {
      return [
        m(
          Form,
          {
            buttons:
              state.tab === tabs.preferences
                ? state.confirm === confirmation.None
                  ? [
                      {
                        accent: true,
                        name: AuthAccountState.translate(ActionDelete),
                        onclick: async (): Promise<void> => {
                          return new Promise((resolve) => {
                            state.confirm = confirmation.Delete;

                            return resolve();
                          });
                        },
                        permitted: Permission.isPermitted(
                          AuthSessionState.data().permissionsHouseholds,
                          PermissionComponentsEnum.Auth,
                          PermissionEnum.Edit,
                          state.authHousehold.id,
                        ),
                        requireOnline: true,
                      },
                      {
                        name: AuthAccountState.translate(
                          WebGlobalActionLeaveHousehold,
                        ),
                        onclick: async (): Promise<void> => {
                          return new Promise((resolve) => {
                            state.confirm = confirmation.Leave;

                            return resolve();
                          });
                        },
                        permitted: !AuthAccountState.data().child,
                        requireOnline: true,
                      },
                      {
                        name: AuthAccountState.translate(
                          WebSettingsHouseholdExportHousehold,
                        ),
                        onclick: async (): Promise<void> => {
                          return fetch(
                            `/api/v1/auth/households/${state.authHousehold.id}/export`,
                            {
                              headers: {
                                "x-homechart-id": apiEndpoint().id,
                                "x-homechart-key": apiEndpoint().key,
                              },
                            },
                          )
                            .then(async (result: Response) => {
                              return result.blob();
                            })
                            .then(async (blob: Blob) => {
                              const file = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = file;
                              link.download = "homechart_export.bin.gz";
                              link.click();
                              link.remove();
                            });
                        },
                        permitted: GlobalState.permitted(
                          PermissionComponentsEnum.Auth,
                          true,
                          state.authHousehold.id,
                        ),
                        requireOnline: true,
                      },
                      InfoState.data().cloud
                        ? null
                        : {
                            name: AuthAccountState.translate(
                              WebSettingsHouseholdImportHousehold,
                            ),
                            oninput: async (file): Promise<void> => {
                              return fetch(
                                `/api/v1/auth/households/${state.authHousehold.id}/import`,
                                {
                                  body: file,
                                  headers: {
                                    "x-homechart-id": apiEndpoint().id,
                                    "x-homechart-key": apiEndpoint().key,
                                  },
                                  method: "POST",
                                },
                              ).then(async () => {
                                return GlobalState.signOut();
                              });
                            },
                            permitted: GlobalState.permitted(
                              PermissionComponentsEnum.Auth,
                              true,
                              state.authHousehold.id,
                            ),
                            requireOnline: true,
                          },
                      {
                        name: AuthAccountState.translate(ActionUpdate),
                        permitted: GlobalState.permitted(
                          PermissionComponentsEnum.Auth,
                          true,
                          state.authHousehold.id,
                        ),
                        primary: true,
                        requireOnline: true,
                        submit: true,
                      },
                    ]
                  : [
                      {
                        name: AuthAccountState.translate(ActionCancel),
                        onclick: async (): Promise<void> => {
                          return new Promise((resolve) => {
                            state.confirm = confirmation.None;

                            return resolve();
                          });
                        },
                        permitted: true,
                        requireOnline: false,
                      },
                      {
                        accent: true,
                        name: `${AuthAccountState.translate(ActionDeleteConfirm)} ${
                          state.confirm === confirmation.Delete
                            ? `${AuthAccountState.translate(ActionDelete)} ${AuthAccountState.translate(ObjectHousehold)}`
                            : AuthAccountState.translate(
                                WebGlobalActionLeaveHousehold,
                              )
                        }`,
                        onclick: async (): Promise<void> => {
                          if (state.confirm === confirmation.Delete) {
                            return AuthHouseholdState.delete(
                              state.authHousehold.id,
                            ).then(async () => {
                              SSEState.clearRefreshed();
                              await AuthSessionState.validate();
                              m.route.set("/settings/households");
                            });
                          }

                          return AuthAccountAuthHouseholdState.delete(
                            state.authHousehold.id,
                            AuthAccountState.data().id,
                          ).then(async () => {
                            SSEState.clearRefreshed();
                            AuthHouseholdState.data([]);
                            AuthHouseholdState.readAll();
                            await AuthAccountState.read();
                            await AuthSessionState.validate();
                            m.route.set("/settings/households");
                          });
                        },
                        permitted: true,
                        requireOnline: true,
                      },
                    ]
                : [],
            onsubmit: async () => {
              return AuthHouseholdState.update(state.authHousehold);
            },
            title: {
              tabs: [
                {
                  active: state.tab === tabs.preferences,
                  name: AuthAccountState.translate(WebGlobalPreferences),
                  onclick: (): void => {
                    state.tab = tabs.preferences;
                  },
                },
                {
                  active: state.tab === tabs.members,
                  name: AuthAccountState.translate(ObjectMembers),
                  onclick: (): void => {
                    state.tab = tabs.members;
                  },
                },
                {
                  active: state.tab === tabs.components,
                  name: AuthAccountState.translate(WebGlobalHideComponents),
                  onclick: (): void => {
                    state.tab = tabs.components;
                  },
                },
              ],
            },
          },
          state.tab === tabs.preferences
            ? [
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
                m(FormItemSelectColor, {
                  disabled: !GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                    state.authHousehold.id,
                  ),
                  name: `${AuthAccountState.translate(ObjectMealPlan)} ${AuthAccountState.translate(FormItemSelectColorName)}`,
                  oninput: (e) => {
                    state.authHousehold.preferences.colorCookMealPlanEvents = e;
                  },
                  value:
                    state.authHousehold.preferences.colorCookMealPlanEvents ===
                    undefined
                      ? ""
                      : state.authHousehold.preferences.colorCookMealPlanEvents,
                }),
                m(FormItemSelectColor, {
                  disabled: !GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                    state.authHousehold.id,
                  ),
                  name: `${AuthAccountState.translate(ObjectRecurringTransaction)} ${AuthAccountState.translate(FormItemSelectColorName)}`,
                  oninput: (e) => {
                    state.authHousehold.preferences.colorBudgetRecurrenceEvents =
                      e;
                  },
                  value:
                    state.authHousehold.preferences
                      .colorBudgetRecurrenceEvents === undefined
                      ? ""
                      : state.authHousehold.preferences
                          .colorBudgetRecurrenceEvents,
                }),
                m(FormItemSelectColor, {
                  disabled: !GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                    state.authHousehold.id,
                  ),
                  name: `${AuthAccountState.translate(ObjectTask)} ${AuthAccountState.translate(FormItemSelectColorName)}`,
                  oninput: (e) => {
                    state.authHousehold.preferences.colorPlanTaskEvents = e;
                  },
                  value:
                    state.authHousehold.preferences.colorPlanTaskEvents ===
                    undefined
                      ? ""
                      : state.authHousehold.preferences.colorPlanTaskEvents,
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
              ]
            : state.tab === tabs.members
              ? m(FormTableAuthHouseholdMembers, {
                  authHouseholdID: state.authHousehold.id,
                })
              : m(TableComponents, {
                  authHouseholdID: state.authHousehold.id,
                }),
        ),
      ];
    },
  };
}
