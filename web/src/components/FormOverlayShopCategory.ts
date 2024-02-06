import { FormItem } from "@lib/components/FormItem";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import { Default } from "@lib/yaml8n";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GlobalState } from "../states/Global";
import type { ShopCategory } from "../states/ShopCategory";
import { ShopCategoryState } from "../states/ShopCategory";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectCategory,
  ObjectStore,
  WebFormOverlayShopCategoryDefaultStoreTooltip,
  WebFormOverlayShopCategoryMatch,
  WebFormOverlayShopCategoryMatchTooltip,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayShopCategory(): m.Component<
  FormOverlayComponentAttrs<ShopCategory>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectCategory),
          onDelete: async (): Promise<void | Err> => {
            return ShopCategoryState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<ShopCategory | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return ShopCategoryState.create(vnode.attrs.data);
            }

            return ShopCategoryState.update(vnode.attrs.data);
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
          m(FormItem, {
            name: AuthAccountState.translate(WebFormOverlayShopCategoryMatch),
            textArea: {
              oninput: (e: string): void => {
                vnode.attrs.data.match = e.split("\n").join("|");
              },
              value:
                vnode.attrs.data.match === ""
                  ? vnode.attrs.data.match
                  : vnode.attrs.data.match.split("|").join("\n"),
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayShopCategoryMatchTooltip,
            ),
          }),
          m(FormItem, {
            name: `${AuthAccountState.translate(Default)} ${AuthAccountState.translate(ObjectStore)}`,
            select: {
              oninput: (e: string): void => {
                const store = BudgetPayeeState.findName(e);
                if (store.id === null) {
                  vnode.attrs.data.budgetPayeeID = null;
                } else {
                  vnode.attrs.data.budgetPayeeID = store.id;
                }
              },
              options: ["", ...BudgetPayeeState.storeNames()],
              value: BudgetPayeeState.findID(vnode.attrs.data.budgetPayeeID)
                .name,
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayShopCategoryDefaultStoreTooltip,
            ),
          }),
        ],
      );
    },
  };
}
