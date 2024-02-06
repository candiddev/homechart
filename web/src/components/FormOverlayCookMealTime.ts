import { FormItem } from "@lib/components/FormItem";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import type { CookMealTime } from "../states/CookMealTime";
import { CookMealTimeState } from "../states/CookMealTime";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectMealTime,
  WebFormOverlayCookMealTimeTime,
  WebFormOverlayCookMealTimeTimeTooltip,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayCookMealTime(): m.Component<
  FormOverlayComponentAttrs<CookMealTime>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectMealTime),
          onDelete: async (): Promise<void | Err> => {
            return CookMealTimeState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<CookMealTime | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return CookMealTimeState.create(vnode.attrs.data);
            }

            return CookMealTimeState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Cook,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Cook,
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
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.time = e;
              },
              required: true,
              type: "time",
              value: vnode.attrs.data.time,
            },
            name: AuthAccountState.translate(WebFormOverlayCookMealTimeTime),
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealTimeTimeTooltip,
            ),
          }),
        ],
      );
    },
  };
}
