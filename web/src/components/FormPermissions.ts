import { FormItem } from "@lib/components/FormItem";
import { AppState } from "@lib/states/App";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";

import { Translations } from "../states/Translations";
import type { Permissions } from "../types/Permission";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";

export interface FormPermissions {
  /** Should a user be shown a subset of permission options to select from? */
  limit?: boolean;

  /** A list of their existing permissions to edit. */
  permissions: Permissions;

  /** Hide household-only permissions. */
  personal?: boolean;
}

export function FormPermissions(): m.Component<FormPermissions> {
  let initPermissions = Permission.new();

  return {
    oninit: (vnode): void => {
      initPermissions = Clone(vnode.attrs.permissions);
    },
    view: (vnode): m.Children => {
      return Translations.permissions.map((permission) => {
        if (vnode.attrs.personal === true && permission.personal !== true) {
          return null;
        }

        return m(FormItem, {
          name: permission.name,
          select: {
            disabled:
              vnode.attrs.limit === true &&
              initPermissions[Permission.components[permission.component]] ===
                PermissionEnum.None,
            oninput: (e: string): void => {
              vnode.attrs.permissions[
                Permission.components[permission.component]
              ] = AppState.data.translations.formPermissionTypes.indexOf(e);
              if (
                AppState.data.translations.formPermissionTypes.indexOf(e) > 0
              ) {
                vnode.attrs.permissions.auth = 1;
              }
              m.redraw();
            },
            options:
              vnode.attrs.limit === true
                ? AppState.data.translations.formPermissionTypes.slice(
                    initPermissions[
                      Permission.components[permission.component]
                    ],
                    permission.component === PermissionComponentsEnum.Auth
                      ? PermissionEnum.View + 1
                      : PermissionEnum.None + 1,
                  )
                : permission.component === PermissionComponentsEnum.Auth
                  ? AppState.data.translations.formPermissionTypes.slice(0, 2)
                  : AppState.data.translations.formPermissionTypes,
            value:
              AppState.data.translations.formPermissionTypes[
                vnode.attrs.permissions[
                  Permission.components[permission.component]
                ]
              ],
          },
          tooltip: permission.tooltip,
        });
      });
    },
  };
}
