import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { ShopItem } from "../states/ShopItem";
import { ShopItemState } from "../states/ShopItem";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectItem } from "../yaml8n";
import { FormShopItem } from "./FormItemsShopItem";

export function FormOverlayShopItem(): m.Component<
  FormOverlayComponentAttrs<ShopItem>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectItem),
          onDelete: async (): Promise<void | Err> => {
            return ShopItemState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<ShopItem | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return ShopItemState.create(vnode.attrs.data);
            }

            return ShopItemState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Shop,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        m(FormShopItem, vnode.attrs),
      );
    },
  };
}
