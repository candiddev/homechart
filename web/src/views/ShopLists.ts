import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayShopList } from "../components/FormOverlayShopList";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import type { ShopList } from "../states/ShopList";
import { ShopListState } from "../states/ShopList";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectBudget,
  ObjectCategory,
  ObjectItems,
  ObjectLists,
  ObjectShop,
  WebGlobalName,
  WebGlobalPersonal,
} from "../yaml8n";

export function ShopLists(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      shopItemCount: "", // eslint-disable-line sort-keys
      personal: "", // eslint-disable-line sort-keys
      budgetCategoryID: "", // eslint-disable-line sort-keys
    }),
    sort: Stream<TableHeaderSortAttrs>({
      formatter: (s: ShopList): string => {
        return s.name;
      },
      invert: false,
      property: "name",
    }),
  };

  let data: Stream<ShopList[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("ShopLists");

      data = Stream.lift(
        (lists, columns, sort) => {
          m.redraw();

          return Filter.array(lists, columns, sort);
        },
        ShopListState.data,
        state.columns,
        state.sort,
      );

      AppState.setLayoutApp({
        ...GetHelp("shop"),
        breadcrumbs: [
          {
            link: "/shop/items",
            name: AuthAccountState.translate(ObjectShop),
          },
          {
            name: AuthAccountState.translate(ObjectLists),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newShopList],
      });

      Telemetry.spanEnd("ShopLists");
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: data(),
        editOnclick: (s: ShopList) => {
          AppState.setLayoutAppForm(FormOverlayShopList, s);
        },
        filters: [],
        loaded: ShopListState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            formatter: (s: ShopList): string => {
              return s.name;
            },
            linkFormatter: (s: ShopList): string => {
              return `/shop/lists/${s.id}`;
            },
            linkRequireOnline: true,
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
            type: TableDataType.Link,
          },
          {
            name: AuthAccountState.translate(ObjectItems),
            noFilter: true,
            property: "shopItemCount",
          },
          {
            formatter: (s: ShopList): boolean => {
              return s.authAccountID !== null;
            },
            name: AuthAccountState.translate(WebGlobalPersonal),
            noFilter: true,
            property: "personal",
            type: TableDataType.Checkbox,
          },
          {
            formatter: (e: ShopList): string => {
              return BudgetCategoryState.findIDHeaderName(e.budgetCategoryID);
            },
            linkFormatter: (): string => {
              return "/budget/categories";
            },
            name: `${AuthAccountState.translate(ObjectBudget)} ${AuthAccountState.translate(ObjectCategory)}`,
            noFilter: true,
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
