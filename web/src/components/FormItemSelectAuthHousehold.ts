import { FormItem } from "@lib/components/FormItem";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { PermissionComponentsEnum } from "../types/Permission";
import { PermissionEnum } from "../types/Permission";
import {
  ObjectOwner,
  WebFormItemSelectAuthHouseholdTooltip,
  WebGlobalPersonal,
} from "../yaml8n";

export interface FormItemSelectAuthHouseholdAttrs {
  /** Item that should have the authHouseholdID set. */
  item: {
    /** AuthAccountID to change. */
    authAccountID?: NullUUID;

    /** AuthHouseholdID to change. */
    authHouseholdID: NullUUID;
  };

  /** Hides Personal option. */
  noPersonal?: boolean;

  /** Permissions to check if the user can change this. */
  permissionComponent: PermissionComponentsEnum;
}

export function FormItemSelectAuthHousehold(): m.Component<FormItemSelectAuthHouseholdAttrs> {
  return {
    view: (vnode): m.Children => {
      const ah = AuthHouseholdState.getPermitted(
        vnode.attrs.permissionComponent,
        PermissionEnum.Edit,
      );

      return (vnode.attrs.item.authAccountID !== undefined && ah.length > 0) ||
        ah.length > 1
        ? m(FormItem, {
            buttonArray: {
              onclick: (e: string): void => {
                if (e === AuthAccountState.data().id) {
                  vnode.attrs.item.authAccountID = e;
                  vnode.attrs.item.authHouseholdID = null;
                } else {
                  if (vnode.attrs.item.authAccountID !== undefined) {
                    vnode.attrs.item.authAccountID = null;
                  }
                  vnode.attrs.item.authHouseholdID = e;
                }
              },
              selected: () => {
                return vnode.attrs.item.authHouseholdID === null
                  ? vnode.attrs.item.authAccountID !== undefined &&
                    vnode.attrs.item.authAccountID !== null
                    ? [vnode.attrs.item.authAccountID]
                    : []
                  : [vnode.attrs.item.authHouseholdID];
              },
              value:
                vnode.attrs.item.authAccountID === undefined ||
                vnode.attrs.noPersonal === true
                  ? ah
                  : [
                      {
                        id: AuthAccountState.data().id,
                        name: AuthAccountState.translate(WebGlobalPersonal),
                      },
                      ...ah,
                    ],
            },
            name: AuthAccountState.translate(ObjectOwner),
            tooltip: AuthAccountState.translate(
              WebFormItemSelectAuthHouseholdTooltip,
            ),
          })
        : [];
    },
  };
}
