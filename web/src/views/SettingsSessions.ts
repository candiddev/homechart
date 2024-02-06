import { Form } from "@lib/components/Form";
import { FormExpander } from "@lib/components/FormExpander";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { UserAgentAPI } from "@lib/types/UserAgent";
import {
  ActionAdd,
  ActionCancel,
  ActionDelete,
  ActionDeleteConfirm,
  ActionUpdate,
  FormCreated,
} from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormPermissions } from "../components/FormPermissions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { AuthSession } from "../states/AuthSession";
import { AuthSessionManager, AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectSession,
  ObjectSessions,
  WebGlobalExpires,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalPermissions,
  WebGlobalPersonal,
  WebGlobalSettings,
  WebSettingsSessionsClearAll,
  WebSettingsSessionsEnableDebug,
  WebSettingsSessionsExpiresTooltip,
  WebSettingsSessionsThisSession,
} from "../yaml8n";

export function SettingsSessions(): m.Component {
  const authSession = new AuthSessionManager();

  const state = {
    columns: Stream<FilterType>({
      name: "",
      created: "", // eslint-disable-line sort-keys
      expires: "",
    }),
    expandHousehold: "",
    expandPersonal: false,
    form: {
      data: authSession.new(),
      deleteConfirm: false,
      visible: false,
    },
    loaded: false,
    sessions: Stream<AuthSession[]>([]),
    sort: Stream({
      invert: true,
      property: "created",
    }),
  };

  async function update(): Promise<void> {
    const s = await AuthSessionState.readAll();

    if (!IsErr(s)) {
      state.sessions(s);
      m.redraw();
    }
  }

  return {
    oninit: async (): Promise<void> => {
      state.loaded = false;

      Telemetry.spanStart("SettingsSessions");

      AppState.setLayoutApp({
        ...GetHelp("settings#sessions"),
        breadcrumbs: [
          {
            link: "/settings/account",
            name: AuthAccountState.translate(WebGlobalSettings),
          },
          {
            name: AuthAccountState.translate(ObjectSessions),
          },
        ],
        toolbarActionButtons: [
          {
            icon: Icons.Session,
            name: AuthAccountState.translate(ObjectSession),
            onclick: (): void => {
              state.form.data = authSession.new();
              state.form.visible = true;
            },
            permitted: GlobalState.permitted(
              PermissionComponentsEnum.Auth,
              true,
            ),
            requireOnline: true,
          },
        ],
      });

      return update().then(() => {
        state.loaded = true;
        Telemetry.spanEnd("SettingsSessions");
      });
    },
    view: (): m.Children => {
      return [
        state.form.visible
          ? m(
              Form,
              {
                buttons: [
                  {
                    accent: true,
                    name: AuthAccountState.translate(ActionDelete),
                    onclick: async (): Promise<void> => {
                      return new Promise((resolve) => {
                        state.form.deleteConfirm = true;

                        return resolve();
                      });
                    },
                    permitted: true,
                    requireOnline:
                      GlobalState.permitted(
                        PermissionComponentsEnum.Auth,
                        true,
                      ) &&
                      state.form.data.id !== null &&
                      !state.form.deleteConfirm,
                  },
                  {
                    name: AuthAccountState.translate(ActionCancel),
                    onclick: async (): Promise<void> => {
                      return new Promise((resolve) => {
                        if (state.form.deleteConfirm) {
                          state.form.deleteConfirm = false;
                        } else {
                          state.form.visible = false;
                        }

                        return resolve();
                      });
                    },
                    permitted: true,
                    requireOnline: true,
                  },
                  {
                    name:
                      state.form.data.id === null
                        ? AuthAccountState.translate(ActionAdd)
                        : AuthAccountState.translate(ActionUpdate),
                    permitted: true,
                    requireOnline:
                      GlobalState.permitted(
                        PermissionComponentsEnum.Auth,
                        true,
                      ) && !state.form.deleteConfirm,
                    submit: true,
                  },
                  {
                    accent: true,
                    name: AuthAccountState.translate(ActionDeleteConfirm),
                    onclick: async (): Promise<void> => {
                      return AuthSessionState.delete(state.form.data.id).then(
                        async () => {
                          state.form.visible = false;

                          return update();
                        },
                      );
                    },
                    permitted:
                      GlobalState.permitted(
                        PermissionComponentsEnum.Auth,
                        true,
                      ) && state.form.deleteConfirm,
                    requireOnline: true,
                  },
                ],
                onsubmit: async (): Promise<void> => {
                  if (state.form.data.id === null) {
                    authSession.data(state.form.data);
                    authSession.data().authAccountID =
                      AuthSessionState.data().authAccountID;
                    authSession.data().userAgent = UserAgentAPI;

                    return authSession.create().then(async () => {
                      state.form.visible = false;

                      return update();
                    });
                  }

                  return authSession.update(state.form.data).then(async () => {
                    if (state.form.data.id === AuthSessionState.data().id) {
                      AuthSessionState.data(state.form.data);
                    }

                    state.form.visible = false;
                    authSession.data().key = null;

                    return update();
                  });
                },
                overlay: true,
                title: {
                  name: `${
                    state.form.data.id === null
                      ? AuthAccountState.translate(ActionAdd)
                      : AuthAccountState.translate(ActionDelete)
                  } ${AuthAccountState.translate(ObjectSession)}`,
                },
              },
              [
                m(FormItem, {
                  input: {
                    disabled: state.form.data.id !== null,
                    oninput: (e: string): void => {
                      state.form.data.name = e;
                    },
                    required: true,
                    type: "text",
                    value: state.form.data.name,
                  },
                  name: AuthAccountState.translate(WebGlobalName),
                  tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
                }),
                m(FormItemInputDate, {
                  name: AuthAccountState.translate(WebGlobalExpires),
                  oninput: (e: string): void => {
                    state.form.data.expires = Timestamp.fromCivilDate(
                      CivilDate.fromString(e),
                    ).toString();
                  },
                  required: true,
                  tooltip: AuthAccountState.translate(
                    WebSettingsSessionsExpiresTooltip,
                  ),
                  value: Timestamp.fromString(state.form.data.expires!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    .toCivilDate()
                    .toJSON(),
                }),
                m(FormExpander, {
                  expand: state.expandPersonal,
                  name: `${AuthAccountState.translate(WebGlobalPersonal)} ${AuthAccountState.translate(WebGlobalPermissions)}`,
                  onclick: () => {
                    state.expandPersonal = !state.expandPersonal;
                  },
                }),
                state.expandPersonal
                  ? m(FormPermissions, {
                      limit: true,
                      permissions: state.form.data.permissionsAccount,
                      personal: true,
                    })
                  : [],
                state.form.data.permissionsHouseholds === null
                  ? []
                  : state.form.data.permissionsHouseholds.map(
                      (_household, i) => {
                        return [
                          m(FormExpander, {
                            expand:
                              state.expandHousehold ===
                              state.form.data.permissionsHouseholds![i]
                                .authHouseholdID, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            name: `${AuthHouseholdState.findID(state.form.data.permissionsHouseholds![i].authHouseholdID).name} ${AuthAccountState.translate(WebGlobalPermissions)}`, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            onclick: () => {
                              state.expandHousehold =
                                state.expandHousehold ===
                                state.form.data.permissionsHouseholds![i]
                                  .authHouseholdID // eslint-disable-line @typescript-eslint/no-non-null-assertion
                                  ? ""
                                  : `${state.form.data.permissionsHouseholds![i].authHouseholdID}`; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            },
                          }),
                          state.expandHousehold ===
                          state.form.data.permissionsHouseholds![i]
                            .authHouseholdID // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            ? m(FormPermissions, {
                                limit: true,
                                permissions:
                                  state.form.data.permissionsHouseholds![i]
                                    .permissions, // eslint-disable-line @typescript-eslint/no-non-null-assertion
                              })
                            : [],
                        ];
                      },
                    ),
              ],
            )
          : [],
        m(Table, {
          actions: [
            {
              accent: true,
              icon: Icons.Clear,
              name: AuthAccountState.translate(WebSettingsSessionsClearAll),
              onclick: async (): Promise<void> => {
                return AuthSessionState.deleteAll().then(async () => {
                  return GlobalState.signOut();
                });
              },
              permitted: GlobalState.permitted(
                PermissionComponentsEnum.Auth,
                true,
              ),
              requireOnline: true,
            },
            {
              name: AuthAccountState.translate(WebSettingsSessionsEnableDebug),
              onclick: async (): Promise<void> => {
                AppState.toggleSessionDebug();

                return Telemetry.enable();
              },
              permitted: !AppState.isSessionDebug(),
              requireOnline: true,
            },
          ],
          data: state.sessions(),
          editOnclick: (s: AuthSession) => {
            state.form.data = s;
            state.form.visible = true;
          },
          filters: [],
          loaded: state.loaded,
          noFilters: true,
          sort: state.sort,
          tableColumns: [
            {
              formatter: (a: AuthSession): string => {
                if (a.id === AuthSessionState.data().id) {
                  return `${a.name} (${AuthAccountState.translate(WebSettingsSessionsThisSession)})`;
                }

                return a.name;
              },
              name: AuthAccountState.translate(WebGlobalName),
              property: "name",
              type: TableDataType.Bold,
            },
            {
              name: "ID",
              property: "id",
            },
            {
              name: AuthAccountState.translate(FormCreated),
              property: "created",
              type: TableDataType.Timestamp,
            },
            {
              name: AuthAccountState.translate(WebGlobalExpires),
              property: "expires",
              type: TableDataType.Timestamp,
            },
          ],
          tableColumnsNameEnabled: state.columns,
          title: {
            subtitles:
              authSession.data().key === null
                ? []
                : [
                    {
                      key: "ID",
                      value: `${authSession.data().id}`,
                    },
                    {
                      key: "Key",
                      value: `${authSession.data().key}`,
                    },
                  ],
          },
        }),
      ];
    },
  };
}
