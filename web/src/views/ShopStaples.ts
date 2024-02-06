import { Button } from "@lib/components/Button";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Recurrence } from "@lib/types/Recurrence";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayShopItem } from "../components/FormOverlayShopItem";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GlobalState } from "../states/Global";
import { ShopCategoryState } from "../states/ShopCategory";
import type { ShopItem } from "../states/ShopItem";
import { ShopItemState } from "../states/ShopItem";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectCategory,
  ObjectShop,
  ObjectStaples,
  ObjectStore,
  WebGlobalName,
  WebGlobalRecurringNextDate,
  WebShopStaplesPickUpNow,
} from "../yaml8n";

function shopStaplePickUp(): m.Component<ShopItem> {
  const today = CivilDate.now();

  return {
    view: (vnode): m.Children => {
      return m("div.TableData__buttons", [
        m("span", AppState.formatCivilDate(vnode.attrs.nextDate)),
        CivilDate.fromString(`${vnode.attrs.nextDate}`) > today
          ? m(Button, {
              accent: true,
              name: AuthAccountState.translate(WebShopStaplesPickUpNow),
              onclick: async (): Promise<void | Err> => {
                const item = Clone(vnode.attrs);
                item.nextDate = CivilDate.now().toJSON();

                return ShopItemState.update(item);
              },
              permitted: GlobalState.permitted(
                PermissionComponentsEnum.Shop,
                true,
                vnode.attrs.authHouseholdID,
              ),
              requireOnline: true,
            })
          : [],
      ]);
    },
  };
}

export function ShopStaples(): m.Component {
  const state = {
    columns: Stream({
      name: "",
      nextDate: "",
    } as FilterType),
    sort: Stream({
      invert: false,
      property: "nextDate",
    }),
  };

  if (AppState.getSessionDisplay() >= DisplayEnum.Small) {
    state.columns({
      name: "",
      budgetPayeeID: "", // eslint-disable-line sort-keys
      shopCategoryID: "",
      nextDate: "", // eslint-disable-line sort-keys
    });
  }

  let data: Stream<ShopItem[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("ShopStaples");

      data = Stream.lift(
        (items, columns, sort) => {
          m.redraw();

          return Filter.array(items, columns, sort);
        },
        ShopItemState.getStaples(),
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
            name: AuthAccountState.translate(ObjectStaples),
          },
        ],
        toolbarActionButtons: [
          {
            ...AppToolbarActions().newShopItem,
            ...{
              onclick: (): void => {
                AppState.setLayoutAppForm(FormOverlayShopItem, {
                  ...ShopItemState.new(),
                  ...{
                    nextDate: CivilDate.now().toJSON(),
                    recurrence: Recurrence.new(),
                  },
                });
              },
            },
          },
        ],
      });

      Telemetry.spanEnd("ShopStaples");
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: data(),
        editOnclick: (s: ShopItem) => {
          AppState.setLayoutAppForm(FormOverlayShopItem, s);
        },
        filters: [],
        loaded: ShopItemState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            name: AuthAccountState.translate(WebGlobalName),
            noFilter: true,
            property: "name",
          },
          {
            formatter: (e: ShopItem): string => {
              return ShopCategoryState.findID(e.shopCategoryID).name;
            },
            name: AuthAccountState.translate(ObjectCategory),
            noFilter: true,
            property: "shopCategoryID",
            type: TableDataType.Link,
          },
          {
            formatter: (e: ShopItem): string => {
              return BudgetPayeeState.findID(e.budgetPayeeID).name;
            },
            linkFormatter: (e: ShopItem): string => {
              const payee = BudgetPayeeState.findID(e.budgetPayeeID);
              return `/shop/items?store=${payee.shortID}`;
            },
            name: AuthAccountState.translate(ObjectStore),
            noFilter: true,
            property: "budgetPayeeID",
            type: TableDataType.Link,
          },
          {
            name: AuthAccountState.translate(WebGlobalRecurringNextDate),
            noFilter: true,
            property: "nextDate",
            render: shopStaplePickUp,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
