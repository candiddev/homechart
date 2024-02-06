import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { FormItemInputIconName } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBudgetAccount } from "../components/FormOverlayBudgetAccount";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { TitleTabsAuthHousehold } from "../components/TitleTabsAuthHouseholds";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { BudgetAccount } from "../states/BudgetAccount";
import { BudgetAccountState } from "../states/BudgetAccount";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectAccounts,
  ObjectBudget,
  WebFormOverlayBudgetAccountOnBudget,
  WebGlobalActionShowHidden,
  WebGlobalBudgetBalance,
  WebGlobalName,
} from "../yaml8n";

export function BudgetAccounts(): m.Component {
  const state: {
    authHouseholdID: Stream<NullUUID>;
    columns: Stream<FilterType>;
    hidden: Stream<boolean>;
    sort: Stream<TableHeaderSortAttrs>;
  } = {
    authHouseholdID: Stream(AuthAccountState.data().primaryAuthHouseholdID),
    columns: Stream<FilterType>({
      name: "",
      icon: "", // eslint-disable-line sort-keys
      budget: "", // eslint-disable-line sort-keys
      budgetTransactionAmount: "", // eslint-disable-line sort-keys
    }),
    hidden: Stream(false as boolean),
    sort: Stream<TableHeaderSortAttrs>({
      formatter: (b: BudgetAccount): string => {
        return b.name;
      },
      invert: false,
      property: "name",
    }),
  };

  let data: Stream<BudgetAccount[]>;

  return {
    oninit: async (): Promise<void> => {
      data = Stream.lift(
        (accounts, authHouseholdID, columns, hide, sort) => {
          m.redraw();

          return Filter.array(
            accounts.filter((account: BudgetAccount) => {
              return (
                (account.hidden === hide && authHouseholdID === null) ||
                account.authHouseholdID === authHouseholdID
              );
            }),
            columns,
            sort,
          );
        },
        BudgetAccountState.data,
        state.authHouseholdID,
        state.columns,
        state.hidden,
        state.sort,
      );

      AppState.setLayoutApp({
        ...GetHelp("budget"),
        breadcrumbs: [
          {
            link: "/budget/accounts",
            name: AuthAccountState.translate(ObjectBudget),
          },
          {
            name: AuthAccountState.translate(ObjectAccounts),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newBudgetAccount],
      });

      if (m.route.param().household === undefined) {
        m.route.param().household = state.authHouseholdID();
      } else {
        state.authHouseholdID(m.route.param().household);
      }
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [
          {
            name: AuthAccountState.translate(WebGlobalActionShowHidden),
            onclick: async (): Promise<void> => {
              return new Promise((resolve) => {
                state.hidden(!state.hidden());

                return resolve();
              });
            },
            permitted: true,
            requireOnline: false,
            secondary: state.hidden(),
          },
        ],
        data: data(),
        editOnclick: (e: BudgetAccount) => {
          AppState.setLayoutAppForm(FormOverlayBudgetAccount, e);
        },
        filters: [],
        loaded: BudgetAccountState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            formatter: (b: BudgetAccount): string => {
              return b.name;
            },
            linkFormatter: (b: BudgetAccount): string => {
              return `/budget/accounts/${b.id}`;
            },
            linkRequireOnline: true,
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
            type: TableDataType.Link,
          },
          {
            name: AuthAccountState.translate(FormItemInputIconName),
            property: "icon",
            type: TableDataType.Icon,
          },
          {
            name: AuthAccountState.translate(
              WebFormOverlayBudgetAccountOnBudget,
            ),
            noFilter: true,
            property: "budget",
            type: TableDataType.Checkbox,
          },
          {
            currencyFormat: AuthHouseholdState.findID(state.authHouseholdID())
              .preferences.currency,
            name: AuthAccountState.translate(WebGlobalBudgetBalance),
            property: "budgetTransactionAmount",
            type: TableDataType.Currency,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
        title: {
          tabs: TitleTabsAuthHousehold(),
        },
      });
    },
  };
}
