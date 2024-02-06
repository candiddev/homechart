import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import type { Err } from "@lib/services/Log";
import { ActionCancel } from "@lib/yaml8n";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { CookRecipeState } from "../states/CookRecipe";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  WebFormImportRecipeTitle,
  WebFormImportRecipeTooltip,
  WebFormImportRecipeWebsiteAddress,
  WebGlobalActionImportRecipe,
} from "../yaml8n";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";

export interface FormImportRecipeAttrs {
  toggle(visible: boolean): void;

  /** Toggle visibility for the form. */
  visible: boolean;
}

export function FormImportRecipe(): m.Component<FormImportRecipeAttrs> {
  const state = {
    authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
    url: "",
  };

  return {
    view: (vnode): m.Children => {
      return vnode.attrs.visible
        ? m(
            Form,
            {
              buttons: [
                {
                  name: AuthAccountState.translate(ActionCancel),
                  onclick: async (): Promise<void> => {
                    return new Promise((resolve) => {
                      vnode.attrs.toggle(false);

                      return resolve();
                    });
                  },
                  permitted: true,
                  requireOnline: true,
                },
                {
                  name: AuthAccountState.translate(WebGlobalActionImportRecipe),
                  onclick: async (): Promise<void | Err> => {
                    return CookRecipeState.importURL(
                      state.url,
                      state.authHouseholdID,
                    );
                  },
                  permitted: true,
                  primary: true,
                  requireOnline: true,
                },
              ],
              overlay: true,
              title: {
                name: AuthAccountState.translate(WebFormImportRecipeTitle),
              },
            },
            [
              m(FormItemSelectAuthHousehold, {
                item: state,
                permissionComponent: PermissionComponentsEnum.Cook,
              }),
              m(FormItem, {
                input: {
                  oninput: (e: string): void => {
                    state.url = e;
                  },
                  placeholder: "https://homechart.app",
                  required: true,
                  type: "url",
                  value: state.url,
                },
                name: AuthAccountState.translate(
                  WebFormImportRecipeWebsiteAddress,
                ),
                tooltip: AuthAccountState.translate(WebFormImportRecipeTooltip),
              }),
            ],
          )
        : [];
    },
  };
}
