import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilTime } from "@lib/types/CivilTime";
import type { FilterType } from "@lib/types/Filter";
import { Timestamp } from "@lib/types/Timestamp";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectNotifications,
  WebAdminNotificationsNewsletter,
  WebGlobalDisabled,
  WebGlobalPersonal,
  WebGlobalSettings,
  WebGlobalType,
  WebSettingsNotificationsDailyAgenda,
  WebSettingsNotificationsDailyAgendaTime,
  WebSettingsNotificationsDailyAgendaTooltip,
  WebSettingsNotificationsDevice,
  WebSettingsNotificationsDisableDevice,
  WebSettingsNotificationsEmail,
  WebSettingsNotificationsEnableDevice,
  WebSettingsNotificationsEventReminders,
  WebSettingsNotificationsRecipeCookReminders,
  WebSettingsNotificationsRecipePrepReminders,
  WebSettingsNotificationsTaskCompleteUpdates,
  WebSettingsNotificationsTaskReminders,
} from "../yaml8n";

interface Notification {
  authHouseholdID?: NullUUID;
  deviceProperty: null | string;
  emailProperty: null | string;
  type: string;
}

export function SettingsNotifications(): m.Component {
  const state = {
    authAccount: AuthAccountState.data(),
    columns: Stream<FilterType>({
      type: "",
      device: "", // eslint-disable-line sort-keys
      email: "",
    }),
  };

  let data: Stream<Notification[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("SettingsNotifications");

      data = AuthHouseholdState.data.map((households) => {
        const n: Notification[] = [
          {
            deviceProperty: "ignoreDeviceAgenda",
            emailProperty: "ignoreEmailAgenda",
            type: AuthAccountState.translate(
              WebSettingsNotificationsDailyAgenda,
            ),
          },
          {
            deviceProperty: null,
            emailProperty: "ignoreEmailNewsletter",
            type: AuthAccountState.translate(WebAdminNotificationsNewsletter),
          },
          {
            deviceProperty: "ignoreDeviceCalendarEvent",
            emailProperty: "ignoreEmailCalendarEvent",
            type: `${AuthAccountState.translate(WebGlobalPersonal)} ${AuthAccountState.translate(WebSettingsNotificationsEventReminders)}`,
          },
          {
            deviceProperty: "ignoreDevicePlanTask",
            emailProperty: "ignoreEmailPlanTask",
            type: `${AuthAccountState.translate(WebGlobalPersonal)} ${AuthAccountState.translate(WebSettingsNotificationsTaskReminders)}`,
          },
        ];

        for (const household of households) {
          n.push(
            ...[
              {
                authHouseholdID: household.id,
                deviceProperty: "ignoreDeviceCalendarEvent",
                emailProperty: "ignoreEmailCalendarEvent",
                type: `${household.name} ${AuthAccountState.translate(WebSettingsNotificationsEventReminders)}`,
              },
              {
                authHouseholdID: household.id,
                deviceProperty: "ignoreDeviceCookMealPlanCook",
                emailProperty: "ignoreEmailCookMealPlanCook",
                type: `${household.name} ${AuthAccountState.translate(WebSettingsNotificationsRecipeCookReminders)}`,
              },
              {
                authHouseholdID: household.id,
                deviceProperty: "ignoreDeviceCookMealPlanPrep",
                emailProperty: "ignoreEmailCookMealPlanPrep",
                type: `${household.name} ${AuthAccountState.translate(WebSettingsNotificationsRecipePrepReminders)}`,
              },
              {
                authHouseholdID: household.id,
                deviceProperty: "ignoreDevicePlanTask",
                emailProperty: "ignoreEmailPlanTask",
                type: `${household.name} ${AuthAccountState.translate(WebSettingsNotificationsTaskReminders)}`,
              },
              {
                authHouseholdID: household.id,
                deviceProperty: "ignoreDevicePlanTaskComplete",
                emailProperty: null,
                type: `${household.name} ${AuthAccountState.translate(WebSettingsNotificationsTaskCompleteUpdates)}`,
              },
            ],
          );
        }

        m.redraw();

        return n;
      });

      AppState.setLayoutApp({
        ...GetHelp("settings#notifications"),
        breadcrumbs: [
          {
            link: "/settings/account",
            name: AuthAccountState.translate(WebGlobalSettings),
          },
          {
            name: AuthAccountState.translate(ObjectNotifications),
          },
        ],
        toolbarActionButtons: [],
      });

      Telemetry.spanEnd("SettingsNotifications");
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          buttons: [
            {
              accent: AuthSessionState.data().webPush !== null,
              name:
                AuthSessionState.data().webPush === null
                  ? AuthAccountState.translate(
                      WebSettingsNotificationsEnableDevice,
                    )
                  : AuthAccountState.translate(
                      WebSettingsNotificationsDisableDevice,
                    ),
              onclick: async (): Promise<void | Err> => {
                return AuthSessionState.toggleNotifications().then(() => {
                  if (
                    "Notification" in window &&
                    Notification.permission !== "granted"
                  ) {
                    AppState.setLayoutAppAlert({
                      message:
                        "Your device is blocking notifications, please allow them for Homechart",
                    });
                  }
                });
              },
              permitted: true,
              primary: AuthSessionState.data().webPush === null,
              requireOnline: true,
            },
          ],
        },
        [
          m(FormItem, {
            name: AuthAccountState.translate(
              WebSettingsNotificationsDailyAgendaTime,
            ),
            select: {
              oninput: async (e: string) => {
                state.authAccount.dailyAgendaTime = CivilTime.fromString(
                  `${`0${e}`.slice(-2)}:00`,
                ).toString(true);
                const t = Timestamp.now();
                t.addDays(1);

                const ct = CivilTime.fromString(e);
                t.timestamp.setHours(ct.hour);
                t.timestamp.setMinutes(ct.minute);

                return AuthAccountState.update({
                  ...state.authAccount,
                  ...{
                    dailyAgendaNext: t.toString(),
                  },
                }).then(() => {
                  state.authAccount = AuthAccountState.data();
                  m.redraw();
                });
              },
              options: [
                ...[...Array(24)].map((_, n) => {
                  return {
                    id: `${n}`,
                    name: CivilTime.fromString(
                      `${`0${n}`.slice(-2)}:00`,
                    ).toString(
                      AuthAccountState.data().preferences.formatTime24,
                    ),
                  };
                }),
              ],
              value:
                state.authAccount.dailyAgendaNext === null
                  ? AuthAccountState.translate(WebGlobalDisabled)
                  : CivilTime.fromString(state.authAccount.dailyAgendaTime)
                      .hour,
            },
            tooltip: AuthAccountState.translate(
              WebSettingsNotificationsDailyAgendaTooltip,
            ),
          }),
          m(Table, {
            actions: [],
            data: data(),
            filters: [],
            getKey: (data: Notification) => {
              return data.type;
            },
            id: "notifications",
            loaded: true,
            noFilters: true,
            tableColumns: [
              {
                name: AuthAccountState.translate(WebGlobalType),
                property: "type",
              },
              {
                checkboxOnclick: async (
                  data: Notification,
                ): Promise<void | Err> => {
                  const property = data.deviceProperty;
                  if (property !== null) {
                    if (data.authHouseholdID === undefined) {
                      state.authAccount.preferences[property] =
                        state.authAccount.preferences[property] === false;
                    } else {
                      if (
                        state.authAccount.preferences
                          .notificationsHouseholds === null ||
                        state.authAccount.preferences.notificationsHouseholds
                          .length === 0
                      ) {
                        state.authAccount.preferences.notificationsHouseholds =
                          [
                            {
                              ...AuthAccountState.newNotificationsHouseholds(),
                              ...{
                                authHouseholdID: data.authHouseholdID,
                              },
                            },
                          ];
                      }

                      let i =
                        state.authAccount.preferences.notificationsHouseholds.findIndex(
                          (ah) => {
                            return ah.authHouseholdID === data.authHouseholdID;
                          },
                        );

                      if (i < 0) {
                        i =
                          state.authAccount.preferences.notificationsHouseholds.push(
                            {
                              ...AuthAccountState.newNotificationsHouseholds(),
                              ...{
                                authHouseholdID: data.authHouseholdID,
                              },
                            },
                          ) - 1;
                      }

                      state.authAccount.preferences.notificationsHouseholds[i][
                        property
                      ] =
                        state.authAccount.preferences.notificationsHouseholds[
                          i
                        ][property] === false;
                    }

                    return AuthAccountState.update(state.authAccount);
                  }
                },
                formatter: (n: Notification): boolean | string => {
                  if (n.deviceProperty === null) {
                    return "";
                  }

                  if (n.authHouseholdID === undefined) {
                    return !(state.authAccount.preferences[
                      n.deviceProperty
                    ] as boolean);
                  }

                  return !(AuthAccountState.findNotificationsHousehold(
                    state.authAccount.preferences.notificationsHouseholds,
                    n.authHouseholdID,
                  )[n.deviceProperty] as boolean);
                },
                name: AuthAccountState.translate(
                  WebSettingsNotificationsDevice,
                ),
                permitted: (): boolean => {
                  return GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                  );
                },
                property: "device",
                type: TableDataType.Checkbox,
              },
              {
                checkboxOnclick: async (
                  data: Notification,
                ): Promise<void | Err> => {
                  const property = data.emailProperty;
                  if (property !== null) {
                    if (data.authHouseholdID === undefined) {
                      state.authAccount.preferences[property] =
                        state.authAccount.preferences[property] === false;
                    } else {
                      if (
                        state.authAccount.preferences
                          .notificationsHouseholds === null ||
                        state.authAccount.preferences
                          .notificationsHouseholds === undefined
                      ) {
                        state.authAccount.preferences.notificationsHouseholds =
                          [];
                      }

                      let i =
                        state.authAccount.preferences.notificationsHouseholds.findIndex(
                          (ah) => {
                            return ah.authHouseholdID === data.authHouseholdID;
                          },
                        );

                      if (i < 0) {
                        i =
                          state.authAccount.preferences.notificationsHouseholds.push(
                            {
                              ...AuthAccountState.newNotificationsHouseholds(),
                              ...{
                                authHouseholdID: data.authHouseholdID,
                              },
                            },
                          ) - 1;
                      }

                      state.authAccount.preferences.notificationsHouseholds[i][
                        property
                      ] =
                        state.authAccount.preferences.notificationsHouseholds[
                          i
                        ][property] === false;
                    }

                    return AuthAccountState.update(state.authAccount);
                  }
                },
                formatter: (n: Notification): boolean | string => {
                  if (n.emailProperty === null) {
                    return "";
                  }

                  if (n.authHouseholdID === undefined) {
                    return !(state.authAccount.preferences[
                      n.emailProperty
                    ] as boolean);
                  }

                  return !(AuthAccountState.findNotificationsHousehold(
                    state.authAccount.preferences.notificationsHouseholds,
                    n.authHouseholdID,
                  )[n.emailProperty] as boolean);
                },
                name: AuthAccountState.translate(WebSettingsNotificationsEmail),
                permitted: (): boolean => {
                  return GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                  );
                },
                property: "email",
                type: TableDataType.Checkbox,
              },
            ],
            tableColumnsNameEnabled: state.columns,
          }),
        ],
      );
    },
  };
}
