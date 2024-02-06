import { FormCheckbox } from "@lib/components/FormCheckbox";
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
import type { BudgetPayee } from "../states/BudgetPayee";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectPayee,
  ObjectStore,
  WebFormContactUsEmailAddressTooltip,
  WebFormOverlayBudgetPayeeAddress,
  WebFormOverlayBudgetPayeeDefaultCategory,
  WebFormOverlayBudgetPayeeDefaultCategoryTooltip,
  WebFormOverlayBudgetPayeeShoppingStore,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayBudgetPayee(): m.Component<
  FormOverlayComponentAttrs<BudgetPayee>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: vnode.attrs.data.shopStore
            ? AuthAccountState.translate(ObjectStore)
            : AuthAccountState.translate(ObjectPayee),
          onDelete: async (): Promise<void | Err> => {
            return BudgetPayeeState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<BudgetPayee | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return BudgetPayeeState.create(vnode.attrs.data);
            }

            return BudgetPayeeState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Budget,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItem, {
            input: {
              datalist: BudgetPayeeState.names(),
              oninput: (e: string): void => {
                const payee = BudgetPayeeState.findName(e);
                if (payee.id === null) {
                  vnode.attrs.data.name = e;
                } else {
                  // This is a hack because it's not currently reactive
                  vnode.attrs.data.address = payee.address;
                  vnode.attrs.data.budgetCategoryID = payee.budgetCategoryID;
                  vnode.attrs.data.icon = payee.icon;
                  vnode.attrs.data.id = payee.id;
                  vnode.attrs.data.name = payee.name;
                  vnode.attrs.data.shopStore = payee.shopStore;
                }
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Budget,
          }),
          m(FormItem, {
            name: AuthAccountState.translate(WebFormOverlayBudgetPayeeAddress),
            textArea: {
              oninput: (e: string): void => {
                vnode.attrs.data.address = e;
              },
              value: vnode.attrs.data.address,
            },
            tooltip: AuthAccountState.translate(
              WebFormContactUsEmailAddressTooltip,
            ),
          }),
          m(FormItemInputIcon, {
            oninput: (e: string): void => {
              vnode.attrs.data.icon = e;
            },
            value: vnode.attrs.data.icon,
          }),
          m.route.get().includes("shop")
            ? []
            : m(FormItem, {
                name: AuthAccountState.translate(
                  WebFormOverlayBudgetPayeeDefaultCategory,
                ),
                select: {
                  oninput: (e: string): void => {
                    vnode.attrs.data.budgetCategoryID =
                      BudgetCategoryState.findGroupName(e).id;
                  },
                  options: ["", ...BudgetCategoryState.names()],
                  value: BudgetCategoryState.findIDHeaderName(
                    vnode.attrs.data.budgetCategoryID,
                  ),
                },
                tooltip: AuthAccountState.translate(
                  WebFormOverlayBudgetPayeeDefaultCategoryTooltip,
                ),
              }),
          m(FormCheckbox, {
            name: AuthAccountState.translate(
              WebFormOverlayBudgetPayeeShoppingStore,
            ),
            onclick: () => {
              vnode.attrs.data.shopStore = !vnode.attrs.data.shopStore;
            },
            value: vnode.attrs.data.shopStore,
          }),
        ],
      );
    },
  };
}
