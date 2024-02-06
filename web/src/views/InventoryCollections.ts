import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { FormItemInputIconName } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayInventoryCollection } from "../components/FormOverlayInventoryCollection";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import type { InventoryCollection } from "../states/InventoryCollection";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectInventory,
  WebGlobalAll,
  WebGlobalAllCollections,
  WebGlobalGrouping,
  WebGlobalName,
} from "../yaml8n";

export function InventoryCollections(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      grouping: "", // eslint-disable-line sort-keys
      icon: "",
    }),
    sort: Stream<TableHeaderSortAttrs>({
      invert: false,
      property: "name",
    }),
  };

  let data: Stream<InventoryCollection[]>;

  return {
    oninit: async (): Promise<void> => {
      data = Stream.lift(
        (collections, columns, sort) => {
          return Filter.array(
            [
              {
                ...InventoryCollectionState.new(),
                ...{
                  icon: Icons.All,
                  id: "all",
                  name: AuthAccountState.translate(WebGlobalAll),
                },
              },
              ...collections,
            ],
            columns,
            sort,
          );
        },
        InventoryCollectionState.data,
        state.columns,
        state.sort,
      );

      AppState.setLayoutApp({
        ...GetHelp("inventory"),
        breadcrumbs: [
          {
            link: "/inventory/all",
            name: AuthAccountState.translate(ObjectInventory),
          },
          {
            name: AuthAccountState.translate(WebGlobalAllCollections),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newInventoryCollection],
      });
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: data(),
        editOnclick: (i: InventoryCollection) => {
          if (i.name === "All") {
            m.route.set("/inventory/all");
          } else {
            AppState.setLayoutAppForm(FormOverlayInventoryCollection, i);
          }
        },
        filters: [],
        loaded: InventoryCollectionState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            formatter: (i: InventoryCollection): string => {
              return i.name;
            },
            linkFormatter: (i: InventoryCollection): string => {
              return `/inventory/${i.id}`;
            },
            linkRequireOnline: true,
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
            type: TableDataType.Link,
          },
          {
            name: AuthAccountState.translate(WebGlobalGrouping),
            property: "grouping",
          },
          {
            name: AuthAccountState.translate(FormItemInputIconName),
            property: "icon",
            type: TableDataType.Icon,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
