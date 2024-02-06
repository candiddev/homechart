import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBudgetPayee } from "../components/FormOverlayBudgetPayee";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import type { BudgetPayee } from "../states/BudgetPayee";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectItems,
  ObjectShop,
  ObjectStores,
  WebFormOverlayBudgetPayeeAddress,
  WebGlobalName,
} from "../yaml8n";

export function ShopStores(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      address: "", // eslint-disable-line sort-keys
      shopItemCount: "",
    }),
    sort: Stream({
      invert: false,
      property: "name",
    }),
  };

  let data: Stream<BudgetPayee[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("ShopStores");

      data = Stream.lift(
        (payees, columns, sort) => {
          return Filter.array(
            payees.filter((payee) => {
              return payee.shopStore;
            }),
            columns,
            sort,
          );
        },
        BudgetPayeeState.data,
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
            name: AuthAccountState.translate(ObjectStores),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newShopStore],
      });

      Telemetry.spanEnd("ShopStores");
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: data(),
        editOnclick: (b: BudgetPayee): void => {
          AppState.setLayoutAppForm(FormOverlayBudgetPayee, b);
        },
        filters: [],
        loaded: BudgetPayeeState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            name: AuthAccountState.translate(WebGlobalName),
            noFilter: true,
            property: "name",
          },
          {
            name: AuthAccountState.translate(WebFormOverlayBudgetPayeeAddress),
            noFilter: true,
            property: "address",
          },
          {
            linkFormatter: (store: BudgetPayee): string => {
              return `/shop/items?store=${store.id}`;
            },
            name: AuthAccountState.translate(ObjectItems),
            noFilter: true,
            property: "shopItemCount",
            type: TableDataType.Link,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
