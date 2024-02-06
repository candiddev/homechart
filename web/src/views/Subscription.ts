import "./Subscription.css";

import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { IconRow } from "@lib/components/IconRow";
import { Table } from "@lib/components/Table";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import { ActionShow, FormCreated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormSubscription } from "../components/FormSubscription";
import { apiEndpoint } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { CloudBackup } from "../states/CloudBackup";
import { CloudBackupState } from "../states/CloudBackup";
import { CloudHouseholdState } from "../states/CloudHousehold";
import { GlobalState } from "../states/Global";
import { InfoState } from "../states/Info";
import { PermissionComponentsEnum } from "../types/Permission";
import { Alerts } from "../utilities/Alerts";
import { Analytics } from "../utilities/Analytics";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectBackup,
  WebGlobalSelfHostedAddress,
  WebGlobalSelfHostedAddressTooltip,
  WebGlobalSubscription,
  WebSubscriptionActions,
  WebSubscriptionBackupKey,
  WebSubscriptionBackupKeyTooltip,
  WebSubscriptionCloudBackups,
  WebSubscriptionCloudFeatures,
  WebSubscriptionEnableCloudBackups,
  WebSubscriptionEnableCloudProxy,
} from "../yaml8n";

export function Subscription(): m.Component {
  const state = {
    authHousehold: Clone(
      AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID),
    ),
    backups: Stream<CloudBackup[]>([]),
    columns: Stream<FilterType>({
      actions: "",
      created: "",
    }),
    loaded: false,
    showBackups: false,
    showEncryptionKey: false,
    showURL: false,
    url: "",
  };

  async function reloadBackups(id: NullUUID): Promise<void> {
    return CloudBackupState.readAll(id).then(async (d) => {
      if (!IsErr(d)) {
        state.backups(d);
        state.loaded = true;
        m.redraw();
      }
    });
  }

  let s: Stream<Promise<void>>;

  return {
    oninit: async (): Promise<void> => {
      state.loaded = false;

      Telemetry.spanStart("Subscription");

      s = AuthHouseholdState.data.map(async (households) => {
        if (state.authHousehold.id === null) {
          state.authHousehold = Clone(
            AuthHouseholdState.findID(
              AuthAccountState.data().primaryAuthHouseholdID,
            ),
          );

          if (state.authHousehold.id === null) {
            state.authHousehold = Clone(
              AuthHouseholdState.findID(m.route.param().household),
            );
          }

          if (
            state.authHousehold.id !== null &&
            m.route.param().success !== undefined
          ) {
            Alerts.purchase();
            Analytics.purchase(state.authHousehold.subscriptionProcessor);
            setTimeout(async () => {
              await CloudHouseholdState.readJWT(state.authHousehold.id);
            }, 1000);
          }
        }

        for (const household of households) {
          if (
            state.authHousehold.id === household.id &&
            household.backupEncryptionKey !== ""
          ) {
            AppState.setLayoutApp({
              ...GetHelp(),
              breadcrumbs: [
                {
                  name: AuthAccountState.translate(WebGlobalSubscription),
                },
              ],
              toolbarActionButtons: [
                {
                  name: AuthAccountState.translate(ObjectBackup),
                  onclick: async (): Promise<void> => {
                    return CloudBackupState.create(household.id).then(
                      async () => {
                        return reloadBackups(household.id);
                      },
                    );
                  },
                  permitted:
                    GlobalState.permitted(
                      PermissionComponentsEnum.Auth,
                      true,
                      household.id,
                    ) &&
                    !InfoState.data().cloud &&
                    household.backupEncryptionKey !== "",
                  requireOnline: true,
                },
              ],
            });

            if (state.backups().length === 0) {
              await reloadBackups(state.authHousehold.id);
            }
          }
        }
      });

      AppState.setLayoutApp({
        ...GetHelp(),
        breadcrumbs: [
          {
            name: AuthAccountState.translate(WebGlobalSubscription),
          },
        ],
        toolbarActionButtons: [],
      });

      if (InfoState.data().cloud) {
        state.url = AuthHouseholdState.findID(
          state.authHousehold.id,
        ).selfHostedURL;
      } else {
        state.url = CloudHouseholdState.findID(
          state.authHousehold.id,
        ).selfHostedURL;
      }

      if (
        !InfoState.data().cloud &&
        AuthHouseholdState.findID(state.authHousehold.id)
          .backupEncryptionKey !== ""
      ) {
        await reloadBackups(state.authHousehold.id);
      }

      Telemetry.spanEnd("Subscription");
    },
    onremove: (): void => {
      s.end(true);
    },
    view: (): m.Children => {
      return [
        m(FormSubscription, {
          authHouseholdID: state.authHousehold.id,
        }),
        m(
          Form,
          {
            title: {
              name: AuthAccountState.translate(WebSubscriptionCloudFeatures),
            },
          },
          [
            InfoState.data().cloud
              ? []
              : [
                  m(FormCheckbox, {
                    name: AuthAccountState.translate(
                      WebSubscriptionEnableCloudBackups,
                    ),
                    onclick: async (): Promise<void> => {
                      if (
                        AuthHouseholdState.findID(state.authHousehold.id)
                          .backupEncryptionKey !== ""
                      ) {
                        state.authHousehold.backupEncryptionKey = "";

                        return AuthHouseholdState.update(
                          state.authHousehold,
                        ).then(() => {
                          state.showBackups = false;
                        });
                      }

                      if (CloudHouseholdState.isExpired()) {
                        Alerts.subscriptionNeeded();
                        return;
                      }

                      state.showBackups = !state.showBackups;
                    },
                    value:
                      state.showBackups ||
                      AuthHouseholdState.findID(state.authHousehold.id)
                        .backupEncryptionKey !== "",
                  }),
                  state.showBackups ||
                  AuthHouseholdState.findID(state.authHousehold.id)
                    .backupEncryptionKey !== ""
                    ? [
                        m(FormItem, {
                          input: {
                            oninput: (e): void => {
                              state.authHousehold.backupEncryptionKey = e;

                              setTimeout(async () => {
                                if (
                                  state.authHousehold.backupEncryptionKey ===
                                    e &&
                                  AuthHouseholdState.findID(
                                    state.authHousehold.id,
                                  ).backupEncryptionKey !== e
                                ) {
                                  return AuthHouseholdState.update(
                                    state.authHousehold,
                                  );
                                }
                              }, 500);
                            },
                            type: state.showEncryptionKey ? "text" : "password",
                            value: state.authHousehold.backupEncryptionKey,
                          },
                          name: AuthAccountState.translate(
                            WebSubscriptionBackupKey,
                          ),
                          tooltip: AuthAccountState.translate(
                            WebSubscriptionBackupKeyTooltip,
                          ),
                        }),
                        m(FormCheckbox, {
                          name: `${AuthAccountState.translate(ActionShow)} ${AuthAccountState.translate(WebSubscriptionBackupKey)}`,
                          onclick: () => {
                            state.showEncryptionKey = !state.showEncryptionKey;
                          },
                          value: state.showEncryptionKey,
                        }),
                      ]
                    : [],
                ],
            m(FormCheckbox, {
              name: AuthAccountState.translate(WebSubscriptionEnableCloudProxy),
              onclick: async (): Promise<void> => {
                if (InfoState.data().cloud) {
                  if (state.authHousehold.selfHostedURL === "") {
                    state.showURL = !state.showURL;
                  } else {
                    state.authHousehold.selfHostedURL = "";
                    await AuthHouseholdState.update(state.authHousehold);
                    state.showURL = state.authHousehold.selfHostedURL !== "";
                  }
                } else if (CloudHouseholdState.isExpired()) {
                  Alerts.subscriptionNeeded();
                  return;
                } else if (!InfoState.data().cloud) {
                  return CloudHouseholdState.update({
                    ...CloudHouseholdState.findID(state.authHousehold.id),
                    ...{
                      selfHostedURL:
                        CloudHouseholdState.findID(state.authHousehold.id)
                          .selfHostedURL === ""
                          ? `${
                              apiEndpoint().hostname === ""
                                ? window.location.origin
                                : apiEndpoint().hostname
                            }`
                          : "",
                    },
                  }).then(() => {
                    state.url = CloudHouseholdState.findID(
                      state.authHousehold.id,
                    ).selfHostedURL;
                    state.showURL =
                      CloudHouseholdState.findID(state.authHousehold.id)
                        .selfHostedURL !== "";
                    m.redraw();
                  });
                }
              },
              value:
                state.showURL ||
                CloudHouseholdState.findID(state.authHousehold.id)
                  .selfHostedURL !== "" ||
                AuthHouseholdState.findID(state.authHousehold.id)
                  .selfHostedURL !== "",
            }),
            state.showURL === true ||
            AuthHouseholdState.findID(state.authHousehold.id).selfHostedURL !==
              "" ||
            CloudHouseholdState.findID(state.authHousehold.id).selfHostedURL !==
              ""
              ? m(FormItem, {
                  input: {
                    oninput: (e): void => {
                      state.url = e;

                      setTimeout(async () => {
                        if (state.url === e) {
                          if (InfoState.data().cloud) {
                            return AuthHouseholdState.update({
                              ...AuthHouseholdState.findID(
                                state.authHousehold.id,
                              ),
                              ...{
                                selfHostedURL: e,
                              },
                            });
                          }
                          return CloudHouseholdState.update({
                            ...CloudHouseholdState.findID(
                              state.authHousehold.id,
                            ),
                            ...{
                              selfHostedURL: e,
                            },
                          });
                        }
                      }, 500);
                    },
                    type: "text",
                    value: state.url,
                  },
                  name: AuthAccountState.translate(WebGlobalSelfHostedAddress),
                  tooltip: AuthAccountState.translate(
                    WebGlobalSelfHostedAddressTooltip,
                  ),
                })
              : [],
          ],
        ),
        !InfoState.data().cloud &&
        state.authHousehold.backupEncryptionKey !== ""
          ? m(Table, {
              actions: [],
              data: state.backups(),
              filters: [],
              loaded: state.loaded,
              noFilters: true,
              tableColumns: [
                {
                  formatter: (a: CloudBackup): string => {
                    return Timestamp.fromString(a.created!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                      .toPrettyString(
                        AuthAccountState.data().preferences.formatDateOrder,
                        AuthAccountState.data().preferences.formatDateSeparator,
                        AuthAccountState.data().preferences.formatTime24,
                      );
                  },
                  name: AuthAccountState.translate(FormCreated),
                  property: "created",
                },
                {
                  name: AuthAccountState.translate(WebSubscriptionActions),
                  property: "actions",
                  render: (): m.Component<CloudBackup> => {
                    return {
                      view: (vnode): m.Children => {
                        return m(IconRow, {
                          icons: [
                            {
                              icon: Icons.Backup,
                              onclick: async (): Promise<void> => {
                                return CloudBackupState.restore(
                                  state.authHousehold.id,
                                  vnode.attrs.id,
                                ).then(async () => {
                                  return GlobalState.signOut();
                                });
                              },
                            },
                            {
                              icon: Icons.Delete,
                              onclick: async (): Promise<void> => {
                                return CloudBackupState.delete(
                                  state.authHousehold.id,
                                  vnode.attrs.id,
                                ).then(async () => {
                                  return reloadBackups(state.authHousehold.id);
                                });
                              },
                            },
                          ],
                        });
                      },
                    };
                  },
                },
              ],
              tableColumnsNameEnabled: state.columns,
              title: {
                name: AuthAccountState.translate(WebSubscriptionCloudBackups),
              },
            })
          : [],
      ];
    },
  };
}
