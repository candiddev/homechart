import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { ActionCancel, ActionUpdate, FormCreated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import type { AuthHousehold } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { Translations } from "../states/Translations";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectHousehold,
  ObjectHouseholds,
  WebAdminHouseholdsLastTransactionID,
  WebAdminHouseholdsMemberCount,
  WebAdminHouseholdsSearch,
  WebAdminHouseholdsSubscriptionCustomerID,
  WebAdminHouseholdsSubscriptionID,
  WebAdminHouseholdsSubscriptionProcessor,
  WebFormSubscriptionExpires,
  WebFormSubscriptionSelfHostedID,
  WebGlobalAdmin,
  WebGlobalExpires,
  WebGlobalOf,
} from "../yaml8n";

export function AdminHouseholds(): m.Component {
  const state: {
    authHouseholds: Stream<AuthHousehold[]>;
    columns: Stream<FilterType>;
    filter: string;
    form: {
      data: AuthHousehold;
      visible: boolean;
    };
    loaded: boolean;
    page: number;
    total: number;
  } = {
    authHouseholds: Stream<AuthHousehold[]>([]),
    columns: Stream<FilterType>({
      id: "",
      countMembers: "", // eslint-disable-line sort-keys
      created: "",
      subscriptionExpires: "",
      subscriptionProcessor: "",
    }),
    filter: "",
    form: {
      data: AuthHouseholdState.new(),
      visible: false,
    },
    loaded: false,
    page: 1,
    total: 0,
  };

  async function update(): Promise<void> {
    let offset = 0;
    if (state.page !== 1) {
      offset = (state.page - 1) * 50;
    }

    state.loaded = false;
    return AuthHouseholdState.readAdmin(state.filter, offset).then(
      (response) => {
        if (!IsErr(response)) {
          state.authHouseholds(response.dataValue);
          state.total = response.dataTotal;
          state.loaded = true;
          m.redraw();
        }
      },
    );
  }

  if (AppState.getSessionDisplay() <= DisplayEnum.Small) {
    state.columns({
      id: "",
      subscriptionProcessor: "",
    });
  }

  const a = Stream.lift(
    (households, columns) => {
      return Filter.array(households, columns, {});
    },
    state.authHouseholds,
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
            name: AuthAccountState.translate(ObjectHouseholds),
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
                    name: AuthAccountState.translate(ActionCancel),
                    onclick: async (): Promise<void> => {
                      return new Promise((resolve) => {
                        state.form.visible = false;

                        return resolve();
                      });
                    },
                    permitted: true,
                    requireOnline: false,
                  },
                  {
                    name: AuthAccountState.translate(ActionUpdate),
                    permitted: true,
                    requireOnline: true,
                    submit: true,
                  },
                ],
                onsubmit: async () => {
                  return AuthHouseholdState.update(state.form.data).then(
                    async () => {
                      state.form.visible = false;
                      return update();
                    },
                  );
                },
                overlay: true,
                title: {
                  name: `${AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectHousehold)}`,
                },
              },
              [
                m(FormItemInputDate, {
                  name: AuthAccountState.translate(WebFormSubscriptionExpires),
                  oninput: (e: string): void => {
                    state.form.data.subscriptionExpires = e;
                  },
                  required: true,
                  tooltip: "",
                  value: state.form.data.subscriptionExpires,
                }),
                m(FormItem, {
                  name: AuthAccountState.translate(
                    WebAdminHouseholdsSubscriptionProcessor,
                  ),
                  select: {
                    oninput: (e: string): void => {
                      state.form.data.subscriptionProcessor =
                        Translations.subscriptionProcessors.indexOf(e);
                    },
                    options: Translations.subscriptionProcessors,
                    required: true,
                    value:
                      Translations.subscriptionProcessors[
                        state.form.data.subscriptionProcessor
                      ],
                  },
                  tooltip: "",
                }),
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.form.data.subscriptionCustomerID = e;
                    },
                    type: "text",
                    value: state.form.data.subscriptionCustomerID,
                  },
                  name: AuthAccountState.translate(
                    WebAdminHouseholdsSubscriptionCustomerID,
                  ),
                  tooltip: "",
                }),
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.form.data.subscriptionID = e;
                    },
                    type: "text",
                    value: state.form.data.subscriptionID,
                  },
                  name: AuthAccountState.translate(
                    WebAdminHouseholdsSubscriptionID,
                  ),
                  tooltip: "",
                }),
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.form.data.subscriptionLastTransactionID = e;
                    },
                    type: "text",
                    value: state.form.data.subscriptionLastTransactionID,
                  },
                  name: AuthAccountState.translate(
                    WebAdminHouseholdsLastTransactionID,
                  ),
                  tooltip: "",
                }),
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.form.data.selfHostedID = e;
                    },
                    type: "text",
                    value: state.form.data.selfHostedID,
                  },
                  name: AuthAccountState.translate(
                    WebFormSubscriptionSelfHostedID,
                  ),
                  tooltip: "",
                }),
              ],
            )
          : [],
        m(Table, {
          actions: [],
          data: a(),
          editOnclick: (h: AuthHousehold): void => {
            state.form.data = h;
            state.form.visible = true;
          },
          filters: [],
          loaded: state.loaded,
          search: {
            onsearch: async (e: string): Promise<void> => {
              state.filter = e;
              return update();
            },
            placeholder: AuthAccountState.translate(WebAdminHouseholdsSearch),
          },
          tableColumns: [
            {
              name: "ID",
              property: "id",
            },
            {
              linkFormatter: (household: AuthHousehold): string => {
                return `/admin/accounts?filter=${household.id}`;
              },
              name: AuthAccountState.translate(WebAdminHouseholdsMemberCount),
              property: "countMembers",
              type: TableDataType.Link,
            },
            {
              name: AuthAccountState.translate(FormCreated),
              property: "created",
              type: TableDataType.Timestamp,
            },
            {
              name: AuthAccountState.translate(WebGlobalExpires),
              property: "subscriptionExpires",
              type: TableDataType.Date,
            },
            {
              formatter: (a: AuthHousehold): string => {
                return Translations.subscriptionProcessors[
                  a.subscriptionProcessor
                ];
              },
              name: AuthAccountState.translate(
                WebAdminHouseholdsSubscriptionProcessor,
              ),
              property: "subscriptionProcessor",
            },
          ],
          tableColumnsNameEnabled: state.columns,
          title: {
            buttonLeft:
              state.page === 1
                ? undefined
                : {
                    href: `/admin/households?page=${state.page - 1}`,
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
                    href: `/admin/households?page=${state.page + 1}`,
                    icon: Icons.Next,
                    iconOnly: true,
                    name: "next",
                    permitted: true,
                    requireOnline: true,
                  },
            name:
              state.authHouseholds().length === 0
                ? `0 - 0 ${AuthAccountState.translate(WebGlobalOf)} 0`
                : state.page === 1
                  ? `1 - ${state.authHouseholds().length} ${AuthAccountState.translate(WebGlobalOf)} ${state.total}`
                  : `${50 * (state.page - 1) + 1} - ${50 * (state.page - 1) + state.authHouseholds().length} ${AuthAccountState.translate(WebGlobalOf)} ${state.total}`,
          },
        }),
      ];
    },
  };
}
