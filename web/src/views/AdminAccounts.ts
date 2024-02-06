import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { OIDCProviderType } from "@lib/types/OIDCProviderType";
import {
  ActionAdd,
  ActionCancel,
  ActionDelete,
  ActionDeleteConfirm,
  ActionNew,
  ActionUpdate,
  FormCreated,
  FormItemNewPasswordPassword,
} from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import type { AuthAccount } from "../states/AuthAccount";
import { AuthAccountManager, AuthAccountState } from "../states/AuthAccount";
import { AuthSessionState } from "../states/AuthSession";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectAccount,
  ObjectAccounts,
  ObjectHousehold,
  WebAdminAccountsLastActivity,
  WebAdminAccountsSearch,
  WebGlobalActionDeleteSessions,
  WebGlobalActionResetPassword,
  WebGlobalAdmin,
  WebGlobalEmailAddress,
  WebGlobalEmailAddressInviteTooltip,
  WebGlobalOf,
  WebGlobalOIDCProvider,
  WebGlobalVerified,
} from "../yaml8n";

export function AdminAccounts(): m.Component {
  const state: {
    authAccounts: Stream<AuthAccount[]>;
    columns: Stream<FilterType>;
    filter: string;
    form: {
      data: AuthAccount;
      deleteConfirm: boolean;
      visible: boolean;
    };
    loaded: boolean;
    page: number;
    total: number;
  } = {
    authAccounts: Stream<AuthAccount[]>([]),
    columns: Stream<FilterType>({
      id: "",
      primaryAuthHouseholdID: "",
      emailAddress: "", // eslint-disable-line sort-keys
      created: "", // eslint-disable-line sort-keys
      lastActivity: "", // eslint-disable-line sort-keys
    }),
    filter: "",
    form: {
      data: AuthAccountState.new(),
      deleteConfirm: false,
      visible: false,
    },
    loaded: false,
    page: 1,
    total: 0,
  };

  const aa = new AuthAccountManager();

  async function update(): Promise<void> {
    let offset = 0;
    if (state.page !== 1) {
      offset = (state.page - 1) * 50;
    }
    return AuthAccountState.readAll(state.filter, offset).then((response) => {
      if (!IsErr(response)) {
        state.authAccounts(response.dataValue);
        state.total = response.dataTotal;
        m.redraw();
      }
    });
  }

  if (AppState.getSessionDisplay() <= DisplayEnum.Small) {
    state.columns({
      authHouseholdID: "",
      emailAddress: "",
    });
  }

  const a = Stream.lift(
    (authAccounts, columns) => {
      return Filter.array(authAccounts, columns, {});
    },
    state.authAccounts,
    state.columns,
  );

  return {
    oninit: async (): Promise<void> => {
      state.loaded = false;

      AppState.setLayoutApp({
        ...GetHelp(),
        breadcrumbs: [
          {
            name: AuthAccountState.translate(WebGlobalAdmin),
          },
          {
            name: AuthAccountState.translate(ObjectAccounts),
          },
        ],
        toolbarActionButtons: [],
      });

      if (m.route.param().filter !== undefined) {
        state.filter = m.route.param().filter;
      }

      if (m.route.param().page !== undefined) {
        state.page = parseInt(m.route.param().page, 10);
      }

      return update().then(() => {
        state.loaded = true;
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
                    name: AuthAccountState.translate(
                      WebGlobalActionDeleteSessions,
                    ),
                    onclick: async (): Promise<void> => {
                      return AuthSessionState.delete(
                        `${state.form.data.id}`,
                      ).then(() => {
                        state.form.visible = false;
                      });
                    },
                    permitted: true,
                    requireOnline: true,
                  },
                  {
                    name: AuthAccountState.translate(
                      WebGlobalActionResetPassword,
                    ),
                    onclick: async (): Promise<void> => {
                      return AuthAccountState.createReset(
                        state.form.data,
                      ).catch((err) => {
                        AppState.setLayoutAppAlert({
                          message: err.message,
                        });
                      });
                    },
                    permitted: true,
                    requireOnline: true,
                  },
                  {
                    accent: true,
                    name: AuthAccountState.translate(ActionDelete),
                    onclick: async (): Promise<void> => {
                      return new Promise((resolve) => {
                        state.form.deleteConfirm = true;

                        return resolve();
                      });
                    },
                    permitted: !state.form.deleteConfirm,
                    requireOnline: true,
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
                    requireOnline: false,
                  },
                  {
                    name:
                      state.form.data.id === null
                        ? AuthAccountState.translate(ActionAdd)
                        : AuthAccountState.translate(ActionUpdate),
                    permitted: !state.form.deleteConfirm,
                    requireOnline: true,
                    submit: true,
                  },
                  {
                    accent: true,
                    name: AuthAccountState.translate(ActionDeleteConfirm),
                    onclick: async (): Promise<void> => {
                      return AuthAccountState.delete(state.form.data.id).then(
                        async () => {
                          state.form.visible = false;
                          return update();
                        },
                      );
                    },
                    permitted: state.form.deleteConfirm,
                    requireOnline: true,
                  },
                ],
                onsubmit: async () => {
                  if (state.form.data.id === null) {
                    state.form.data.tosAccepted = true;

                    aa.data(state.form.data);

                    return aa.create(false).then(async () => {
                      state.form.visible = false;
                      return update();
                    });
                  }

                  return aa.update(state.form.data).then(async () => {
                    state.form.visible = false;
                    return update();
                  });
                },
                overlay: true,
                title: {
                  name: `${
                    state.form.data.id === null
                      ? AuthAccountState.translate(ActionAdd)
                      : AuthAccountState.translate(ActionUpdate)
                  } ${AuthAccountState.translate(ObjectAccount)}`,
                },
              },
              [
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.form.data.emailAddress = e;
                    },
                    required: false,
                    type: "text",
                    value: state.form.data.emailAddress,
                  },
                  name: AuthAccountState.translate(WebGlobalEmailAddress),
                  tooltip: AuthAccountState.translate(
                    WebGlobalEmailAddressInviteTooltip,
                  ),
                }),
                m(FormItem, {
                  input: {
                    disabled: true,
                    oninput: (): void => {},
                    type: "text",
                    value:
                      OIDCProviderType.values[state.form.data.oidcProviderType],
                  },
                  name: AuthAccountState.translate(WebGlobalOIDCProvider),
                  tooltip: "",
                }),
                m(FormItem, {
                  input: {
                    oninput: (e): void => {
                      state.form.data.password = e;
                    },
                    type: "text",
                    value: state.form.data.password,
                  },
                  name: `${AuthAccountState.translate(ActionNew)} ${AuthAccountState.translate(FormItemNewPasswordPassword)}`,
                  tooltip: "",
                }),
                m(FormCheckbox, {
                  name: AuthAccountState.translate(WebGlobalVerified),
                  onclick: () => {
                    state.form.data.verified = !state.form.data.verified;
                  },
                  value: state.form.data.verified,
                }),
              ],
            )
          : [],
        m(Table, {
          actions: [
            {
              icon: Icons.Invite,
              name: AuthAccountState.translate(ActionAdd),
              onclick: async (): Promise<void> => {
                state.form.data = AuthAccountState.new();
                state.form.visible = true;
              },
              permitted: true,
              primary: true,
              requireOnline: true,
            },
          ],
          data: a(),
          editOnclick: (a: AuthAccount) => {
            state.form.data = a;
            state.form.visible = true;
          },
          filters: [],
          loaded: state.loaded,
          search: {
            onsearch: async (e: string): Promise<void> => {
              state.filter = e;
              return update();
            },
            placeholder: AuthAccountState.translate(WebAdminAccountsSearch),
          },
          tableColumns: [
            {
              name: "ID",
              property: "id",
            },
            {
              linkFormatter: (account: AuthAccount): string => {
                return `/admin/households?filter=${account.primaryAuthHouseholdID}`;
              },
              name: `${AuthAccountState.translate(ObjectHousehold)} ID`,
              property: "primaryAuthHouseholdID",
              type: TableDataType.Link,
            },
            {
              name: AuthAccountState.translate(WebGlobalEmailAddress),
              property: "emailAddress",
            },
            {
              name: AuthAccountState.translate(FormCreated),
              property: "created",
              type: TableDataType.Timestamp,
            },
            {
              name: AuthAccountState.translate(WebAdminAccountsLastActivity),
              property: "lastActivity",
              type: TableDataType.Timestamp,
            },
          ],
          tableColumnsNameEnabled: state.columns,
          title: {
            buttonLeft:
              state.page === 1
                ? undefined
                : {
                    href: `/admin/accounts?page=${state.page - 1}`,
                    icon: Icons.Previous,
                    iconOnly: true,
                    name: "previous",
                    permitted: true,
                    requireOnline: true,
                  },
            buttonRight:
              state.page * 50 > state.total
                ? undefined
                : {
                    href: `/admin/accounts?page=${state.page + 1}`,
                    icon: Icons.Next,
                    iconOnly: true,
                    name: "next",
                    permitted: true,
                    requireOnline: true,
                  },
            name:
              state.authAccounts().length === 0
                ? `0 - 0 ${AuthAccountState.translate(WebGlobalOf)} 0`
                : state.page === 1
                  ? `1 - ${state.authAccounts().length} ${AuthAccountState.translate(WebGlobalOf)} ${state.total}`
                  : `${50 * (state.page - 1) + 1} - ${50 * (state.page - 1) + state.authAccounts().length} ${AuthAccountState.translate(WebGlobalOf)} ${state.total}`,
          },
        }),
      ];
    },
  };
}
