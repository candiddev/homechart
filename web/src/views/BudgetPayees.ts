import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import { Currency } from "@lib/types/Currency";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBudgetPayee } from "../components/FormOverlayBudgetPayee";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetCategoryState } from "../states/BudgetCategory";
import type { BudgetPayee } from "../states/BudgetPayee";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectBudget,
  ObjectPayees,
  WebFormOverlayBudgetPayeeDefaultCategory,
  WebGlobalBudgetBalance,
  WebGlobalName,
} from "../yaml8n";

export function BudgetPayees(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      budgetTransactionAmount: "", // eslint-disable-line sort-keys
      budgetCategoryID: "", // eslint-disable-line sort-keys
    }),
    sort: Stream<TableHeaderSortAttrs>({
      formatter: (b: BudgetPayee): string => {
        return b.name;
      },
      invert: false,
      property: "name",
    }),
  };

  const p = Stream.lift(
    (payees, columns, sort) => {
      m.redraw();

      return Filter.array(payees, columns, sort);
    },
    BudgetPayeeState.data,
    state.columns,
    state.sort,
  );

  if (AppState.getSessionDisplay() <= DisplayEnum.Medium) {
    state.columns({
      name: "",
      budgetTransactionAmount: "", // eslint-disable-line sort-keys
    });
  }

  return {
    oninit: async (): Promise<void> => {
      AppState.setLayoutApp({
        ...GetHelp("budget"),
        breadcrumbs: [
          {
            link: "/budget/accounts",
            name: AuthAccountState.translate(ObjectBudget),
          },
          {
            name: AuthAccountState.translate(ObjectPayees),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newBudgetPayee],
      });
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: p(),
        editOnclick: (b: BudgetPayee) => {
          AppState.setLayoutAppForm(FormOverlayBudgetPayee, b);
        },
        filters: [],
        loaded: BudgetPayeeState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            linkRequireOnline: true,
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
          },
          {
            formatter: (payee: BudgetPayee): string => {
              return Currency.toString(
                payee.budgetTransactionAmount,
                AuthHouseholdState.findID(payee.authHouseholdID).preferences
                  .currency,
              );
            },
            linkFormatter: (payee: BudgetPayee): string => {
              return `/budget/transactions?payee=${payee.id}`;
            },
            linkRequireOnline: true,
            name: AuthAccountState.translate(WebGlobalBudgetBalance),
            property: "budgetTransactionAmount",
            sortFormatter: (payee: BudgetPayee): number => {
              return payee.budgetTransactionAmount;
            },
            type: TableDataType.Link,
          },
          {
            formatter: (payee: BudgetPayee): string => {
              return BudgetCategoryState.findIDHeaderName(
                payee.budgetCategoryID,
              );
            },
            linkFormatter: (): string => {
              return "/budget/categories";
            },
            linkRequireOnline: true,
            name: AuthAccountState.translate(
              WebFormOverlayBudgetPayeeDefaultCategory,
            ),
            property: "budgetCategoryID",
            type: TableDataType.Link,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
