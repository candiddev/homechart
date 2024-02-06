import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { GlobalState } from "../states/Global";
import type { ShopList } from "../states/ShopList";
import { ShopListState } from "../states/ShopList";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectBudget,
  ObjectCategory,
  ObjectList,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayShopList(): m.Component<
  FormOverlayComponentAttrs<ShopList>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectList),
          onDelete: async (): Promise<void | Err> => {
            return ShopListState.delete(vnode.attrs.data.id).then(() => {
              if (
                m.route.get().includes(`/shop/lists/${vnode.attrs.data.id}`)
              ) {
                m.route.set("/shop/lists", "", {
                  state: {
                    key: Date.now(),
                  },
                });
              }
            });
          },
          onSubmit: async (): Promise<ShopList | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return ShopListState.create(vnode.attrs.data);
            }

            return ShopListState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Shop,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Shop,
          }),
          m(FormItem, {
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.name = e;
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormItemInputIcon, {
            oninput: (icon) => {
              vnode.attrs.data.icon = icon;
            },
            value: vnode.attrs.data.icon,
          }),
          m(FormItem, {
            name: `${AuthAccountState.translate(ObjectBudget)} ${AuthAccountState.translate(ObjectCategory)}`,
            select: {
              oninput: (e: string): void => {
                if (e === "") {
                  vnode.attrs.data.budgetCategoryID = null;
                } else {
                  vnode.attrs.data.budgetCategoryID =
                    BudgetCategoryState.findGroupName(e).id;
                }
              },
              options: ["", ...BudgetCategoryState.names()],
              value: BudgetCategoryState.findIDHeaderName(
                vnode.attrs.data.budgetCategoryID,
              ),
            },
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
        ],
      );
    },
  };
}
