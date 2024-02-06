import { Button } from "@lib/components/Button";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import type { AppBreadcrumb } from "@lib/layout/AppToolbar";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Position } from "@lib/types/Position";
import type { RecurrenceInterval } from "@lib/types/Recurrence";
import { Recurrence } from "@lib/types/Recurrence";
import { Clone } from "@lib/utilities/Clone";
import { Drag } from "@lib/utilities/Drag";
import { ActionEdit } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayShopItem } from "../components/FormOverlayShopItem";
import { FormOverlayShopList } from "../components/FormOverlayShopList";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { PlanProjectState } from "../states/PlanProject";
import { ShopCategoryState } from "../states/ShopCategory";
import type { ShopItem } from "../states/ShopItem";
import { ShopItemState } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectCategories,
  ObjectCategory,
  ObjectList,
  ObjectListPickUp,
  ObjectLists,
  ObjectMeal,
  ObjectProject,
  ObjectRecipe,
  ObjectShop,
  ObjectStore,
  WebFormItemsShopItemPrice,
  WebGlobalActionSkip,
  WebGlobalAll,
  WebGlobalBudgeted,
  WebGlobalName,
  WebGlobalPriority,
  WebGlobalSearch,
  WebShopItemsClearCart,
  WebShopItemsClearCartSucccess,
  WebShopItemsClearPurchased,
  WebShopItemsClearPurchasedSuccess,
  WebShopItemsCost,
  WebShopItemsInCart,
  WebShopItemsPurchased,
  WebShopItemsToGet,
} from "../yaml8n";

function name(): m.Component<ShopItem> {
  return {
    view: (vnode): m.Children => {
      return m("div.TableData__buttons", [
        m("span", vnode.attrs.name),
        vnode.attrs.recurrence === null
          ? []
          : m(Button, {
              accent: true,
              id: `skip-${vnode.attrs.id}`,
              name: AuthAccountState.translate(WebGlobalActionSkip),
              onclick: async (): Promise<void | Err> => {
                const data = Clone(vnode.attrs);

                data.nextDate = Recurrence.nextCivilDate(
                  data.recurrence as RecurrenceInterval,
                  CivilDate.fromString(`${data.nextDate}`),
                ).toJSON();

                return ShopItemState.update(data);
              },
              permitted: GlobalState.permitted(
                PermissionComponentsEnum.Shop,
                true,
              ),
              requireOnline: true,
            }),
      ]);
    },
  };
}

export function ShopItems(): m.Component {
  const state = {
    amount: 0,
    categories: [] as {
      id: NullUUID;
      name: string;
    }[],
    categoryID: Stream(null as NullUUID),
    columns: Stream<FilterType>({}),
    countAll: 0,
    countInCart: 0,
    countToGet: 0,
    list: Stream(ShopListState.new()),
    listID: Stream(null as NullUUID),
    positions: [] as NullUUID[],
    search: Stream(""),
    sort: Stream({
      // eslint-disable-line @typescript-eslint/consistent-type-assertions
      formatter: (e: ShopItem): string => {
        return ShopCategoryState.findID(e.shopCategoryID).name;
      },

      invert: false,
      property: "shopCategoryID",
    } as TableHeaderSortAttrs),
    status: Stream(""),
    store: Stream(BudgetPayeeState.new()),
    storeID: Stream(null as NullUUID),
  };

  let data: Stream<ShopItem[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("ShopItems");

      data = Stream.lift(
        (
          _stores,
          _categories,
          _lists,
          _items,
          categoryID,
          columns,
          search,
          sort,
          status,
          listID,
          storeID,
        ) => {
          let newItems: ShopItem[] = [];
          let breadcrumbs: AppBreadcrumb[] = [];

          if (listID !== null) {
            state.list(ShopListState.findID(listID));

            breadcrumbs = [
              {
                link: "/shop/items",
                name: AuthAccountState.translate(ObjectShop),
              },
              {
                link: "/shop/lists",
                name: AuthAccountState.translate(ObjectLists),
              },
              {
                name: state.list().name,
              },
            ];

            newItems = ShopItemState.data().filter((item: ShopItem) => {
              return item.shopListID === state.list().id;
            });
            // eslint-disable-next-line no-negated-condition
          } else if (storeID !== null) {
            state.store(BudgetPayeeState.findID(storeID));

            (breadcrumbs = [
              {
                link: "/shop/items",
                name: AuthAccountState.translate(ObjectShop),
              },
              {
                link: "/shop/items",
                name: AuthAccountState.translate(ObjectListPickUp),
              },
              {
                name: state.store().name,
              },
            ]),
              (newItems = ShopItemState.getPickupItems().filter(
                (item: ShopItem) => {
                  return (
                    item.budgetPayeeID === state.store().id ||
                    item.budgetPayeeID === null
                  );
                },
              ));
          } else {
            breadcrumbs = [
              {
                link: "/shop/items",
                name: AuthAccountState.translate(ObjectShop),
              },
              {
                name: AuthAccountState.translate(ObjectListPickUp),
              },
            ];

            newItems = ShopItemState.getPickupItems();
          }

          AppState.setLayoutApp({
            ...GetHelp("shop"),
            breadcrumbs: breadcrumbs,
            toolbarActionButtons: [
              {
                ...AppToolbarActions().newShopItem,
                ...{
                  onclick: (): void => {
                    AppState.setLayoutAppForm(FormOverlayShopItem, {
                      ...ShopItemState.new(),
                      ...{
                        authAccountID: state.list().authAccountID,
                        authHouseholdID: state.list().authHouseholdID,
                        budgetPayeeID: state.storeID(),
                        shopListID: state.listID(),
                      },
                    });
                  },
                },
              },
            ],
          });

          state.categories = [];

          state.countAll = newItems.length;

          state.countInCart = 0;
          state.countToGet = 0;

          newItems = newItems.filter((item: ShopItem) => {
            if (categoryID !== null && item.shopCategoryID !== categoryID) {
              return false;
            }

            if (item.inCart) {
              state.countInCart++;
            } else {
              state.countToGet++;
            }

            if (
              search !== "" &&
              !item.name.toLowerCase().includes(search.toLowerCase())
            ) {
              return false;
            }

            if (status === "toget" && item.inCart) {
              return false;
            }

            if (status === "incart" && item.inCart === false) {
              return false;
            }

            if (item.shopCategoryID !== null) {
              const i = state.categories.findIndex((category) => {
                return category.id === item.shopCategoryID;
              });

              if (i < 0) {
                state.categories.push({
                  id: item.shopCategoryID,
                  name: ShopCategoryState.findID(item.shopCategoryID).name,
                });
              }
            }

            return true;
          });

          state.amount = 0;
          for (const item of newItems) {
            if (!item.inCart) {
              state.amount += item.price;
            }
          }

          state.positions = Position.sort(newItems).map((newItems) => {
            return newItems.id;
          });

          m.redraw();

          return Filter.array(newItems, columns, sort);
        },
        BudgetPayeeState.data,
        ShopCategoryState.data,
        ShopListState.data,
        ShopItemState.data,
        state.categoryID,
        state.columns,
        state.search,
        state.sort,
        state.status,
        state.listID,
        state.storeID,
      );

      if (m.route.param().category === undefined) {
        state.categoryID(null);
      } else {
        state.categoryID(m.route.param().category);
      }

      if (m.route.param().filter === undefined) {
        state.status("");
      } else {
        state.status(m.route.param().filter);
      }

      if (m.route.param().list === undefined) {
        state.listID(null);
      } else {
        state.listID(m.route.param().list);
      }

      if (m.route.param().store === undefined) {
        state.storeID(null);
      } else {
        state.storeID(m.route.param().store);
      }

      state.columns = Stream<FilterType>({
        inCart: "",
        name: "",
        shopCategoryID: "",
      });

      if (state.listID() !== null) {
        state.columns({
          ...{
            position: "",
          },
          ...state.columns(),
        });
      }

      if (AppState.getSessionDisplay() > DisplayEnum.XSmall) {
        state.columns().budgetPayeeID = "";
        state.columns().price = "";
      }

      if (AppState.getSessionDisplay() > DisplayEnum.Small) {
        state.columns().cookRecipeID = "";
        state.columns().cookMealPlanID = "";
        state.columns().planProjectID = "";
      }

      Telemetry.spanEnd("ShopItems");
    },
    view: (): m.Children => {
      const budgetCategory = BudgetCategoryState.findID(
        state.list().budgetCategoryID,
      );

      return m(Table, {
        actions: [
          {
            accent: true,
            icon: Icons.Clear,
            name:
              state.listID() === null
                ? AuthAccountState.translate(WebShopItemsClearCart)
                : AuthAccountState.translate(WebShopItemsClearPurchased),
            onclick: async (): Promise<void> => {
              for (const item of data().filter((filter) => {
                return filter.inCart;
              })) {
                if (item.inCart === true) {
                  if (item.recurrence !== null && item.nextDate !== null) {
                    item.nextDate = Recurrence.nextCivilDate(
                      item.recurrence,
                      CivilDate.fromString(item.nextDate),
                    ).toJSON();
                    item.inCart = false;

                    await ShopItemState.update(item, true);
                  } else {
                    await ShopItemState.delete(item.id, true);
                  }
                }
              }

              AppState.setLayoutAppAlert({
                message:
                  state.listID() === null
                    ? AuthAccountState.translate(WebShopItemsClearCartSucccess)
                    : AuthAccountState.translate(
                        WebShopItemsClearPurchasedSuccess,
                      ),
              });
            },
            permitted:
              GlobalState.permitted(PermissionComponentsEnum.Shop, true) &&
              data().filter((item) => {
                return item.inCart;
              }).length > 0 &&
              state.status() !== "toget",
            requireOnline: true,
          },
          ...(state.listID() === null
            ? []
            : [
                {
                  icon: Icons.Edit,
                  name: `${AuthAccountState.translate(ActionEdit)} ${AuthAccountState.translate(ObjectList)}`,
                  onclick: async (): Promise<void> => {
                    return new Promise((resolve) => {
                      AppState.setLayoutAppForm(
                        FormOverlayShopList,
                        state.list(),
                      );

                      return resolve();
                    });
                  },
                  permitted: GlobalState.permitted(
                    PermissionComponentsEnum.Shop,
                    true,
                    state.list().authHouseholdID,
                  ),
                  requireOnline: true,
                },
              ]),
        ],
        data: data(),
        editOnclick: (s: ShopItem) => {
          AppState.setLayoutAppForm(FormOverlayShopItem, s);
        },
        filters: [
          {
            name: AuthAccountState.translate(ObjectCategories),
            onclick: (e): void => {
              if (state.categoryID() === e) {
                state.categoryID(null);
              } else {
                state.categoryID(e);
              }
            },
            selected: (): string[] => {
              return [`${state.categoryID()}`];
            },
            value: state.categories,
          },
        ],
        loaded:
          BudgetPayeeState.isLoaded() &&
          PlanProjectState.isLoaded() &&
          ShopCategoryState.isLoaded() &&
          ShopItemState.isLoaded(),
        search: {
          onsearch: (e: string): void => {
            state.search(e);
          },
          placeholder: AuthAccountState.translate(WebGlobalSearch),
        },
        sort: state.sort,
        tableColumns: [
          {
            formatter: (s: ShopItem): number => {
              return state.positions.indexOf(s.id) + 1;
            },
            name: AuthAccountState.translate(WebGlobalPriority),
            ondragend: async (): Promise<void | Err> => {
              if (Drag.state.target !== "") {
                const source = ShopItemState.findID(
                  Drag.state.source.split("_")[1],
                );
                const target = ShopItemState.findID(
                  Drag.state.target.split("_")[1],
                );

                source.position = Position.adjacent(
                  target,
                  ShopItemState.findAdjacent(target),
                  Drag.state.before,
                );

                return ShopItemState.update(source);
              }

              return;
            },
            permitted: (s: ShopItem): boolean => {
              return GlobalState.permitted(
                PermissionComponentsEnum.Shop,
                true,
                s.authHouseholdID,
              );
            },
            property: "position",
            type: TableDataType.Drag,
          },
          {
            checkboxOnclick: async (data: ShopItem): Promise<void | Err> => {
              data.inCart = !data.inCart;

              return ShopItemState.update(data).catch(() => {
                data.inCart = !data.inCart;
              });
            },
            name: m.route.get().includes("list")
              ? AuthAccountState.translate(WebShopItemsPurchased)
              : AuthAccountState.translate(WebShopItemsInCart),
            noFilter: true,
            permitted: (s: ShopItem): boolean => {
              return GlobalState.permitted(
                PermissionComponentsEnum.Shop,
                true,
                s.authHouseholdID,
              );
            },
            property: "inCart",
            type: TableDataType.Checkbox,
          },
          {
            name: AuthAccountState.translate(WebGlobalName),
            noFilter: true,
            property: "name",
            render: name,
          },
          {
            currencyFormat: AuthHouseholdState.findID(
              AuthAccountState.data().primaryAuthHouseholdID,
            ).preferences.currency,
            formatter: (s: ShopItem): number | string => {
              return s.price === undefined || s.price === 0 ? "" : -1 * s.price;
            },
            name: AuthAccountState.translate(WebFormItemsShopItemPrice),
            noFilter: true,
            property: "price",
            type: TableDataType.Currency,
          },
          {
            formatter: (e: ShopItem): string => {
              return ShopCategoryState.findID(e.shopCategoryID).name;
            },
            linkFormatter: (e: ShopItem): string => {
              return m.buildPathname("/shop/items", {
                ...m.route.param(),
                ...{
                  category: e.shopCategoryID,
                },
              });
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
              return m.buildPathname("/shop/items", {
                ...m.route.param(),
                ...{
                  store: e.budgetPayeeID,
                },
              });
            },
            name: AuthAccountState.translate(ObjectStore),
            noFilter: true,
            property: "budgetPayeeID",
            type: TableDataType.Link,
          },
          {
            formatter: (e: ShopItem): string => {
              return CookRecipeState.findID(
                CookMealPlanState.findID(e.cookMealPlanID).cookRecipeID,
              ).name;
            },
            linkFormatter: (e: ShopItem): string => {
              return `/cook/recipes/${CookMealPlanState.findID(e.cookMealPlanID).cookRecipeID}`;
            },
            name: AuthAccountState.translate(ObjectRecipe),
            noFilter: true,
            property: "cookRecipeID",
            type: TableDataType.Link,
          },
          {
            formatter: (e: ShopItem): string => {
              if (e.cookMealPlanID === null) {
                return "";
              }

              const plan = CookMealPlanState.findID(e.cookMealPlanID);

              return `${AppState.formatCivilDate(plan.date as string)} - ${CookMealTimeState.findID(plan.cookMealTimeID).name}`;
            },
            linkFormatter: (): string => {
              return "/calendar";
            },
            name: AuthAccountState.translate(ObjectMeal),
            noFilter: true,
            property: "cookMealPlanID",
            type: TableDataType.Link,
          },
          {
            formatter: (e: ShopItem): string => {
              return PlanProjectState.findID(e.planProjectID).name;
            },
            linkFormatter: (e: ShopItem): string => {
              return `/plan/tasks?project=${e.planProjectID}`;
            },
            name: AuthAccountState.translate(ObjectProject),
            noFilter: true,
            property: "planProjectID",
            type: TableDataType.Link,
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
        title: {
          subtitles: [
            ...(state.list().budgetCategoryID === null
              ? []
              : [
                  {
                    color:
                      budgetCategory.budgetMonthCategoryAmount +
                        budgetCategory.budgetTransactionAmount >
                      0
                        ? "var(--color_positive)"
                        : "var(--color_negative)",
                    key: AuthAccountState.translate(WebGlobalBudgeted),
                    value: Currency.toString(
                      budgetCategory.budgetMonthCategoryAmount +
                        budgetCategory.budgetTransactionAmount,
                      AuthHouseholdState.findID(
                        AuthAccountState.data().primaryAuthHouseholdID,
                      ).preferences.currency,
                    ),
                  },
                ]),
            ...(state.amount > 0
              ? [
                  {
                    color:
                      budgetCategory.budgetMonthCategoryAmount +
                        budgetCategory.budgetTransactionAmount >=
                      state.amount
                        ? "var(--color_positive)"
                        : "var(--color_negative)",
                    key: AuthAccountState.translate(WebShopItemsCost),
                    value: Currency.toString(
                      state.amount,
                      AuthHouseholdState.findID(
                        AuthAccountState.data().primaryAuthHouseholdID,
                      ).preferences.currency,
                    ),
                  },
                ]
              : []),
          ],
          tabs: m.route.get().includes("list")
            ? undefined
            : [
                {
                  active: m.route.param().filter === undefined,
                  count: state.countAll,
                  href: `/shop/items${
                    m.route.param().store === undefined
                      ? ""
                      : `?store=${m.route.param().store}`
                  }`,
                  name: AuthAccountState.translate(WebGlobalAll),
                },
                {
                  active: m.route.param().filter === "incart",
                  count: state.countInCart,
                  href: `${m.parsePathname(m.route.get()).path}?filter=incart${
                    m.route.param().store === undefined
                      ? ""
                      : `&store=${m.route.param().store}`
                  }`,
                  name: AuthAccountState.translate(WebShopItemsInCart),
                },
                {
                  active: m.route.param().filter === "toget",
                  count: state.countToGet,
                  href: `/shop/items?filter=toget${
                    m.route.param().store === undefined
                      ? ""
                      : `&store=${m.route.param().store}`
                  }`,
                  name: AuthAccountState.translate(WebShopItemsToGet),
                },
              ],
        },
      });
    },
  };
}
