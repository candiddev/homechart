import { FormItem } from "@lib/components/FormItem";
import { FormItemNewPassword } from "@lib/components/FormItemNewPassword";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import type { AuthAccountPrivateKey } from "../states/AuthAccount";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  WebFormOverlayAuthAccountPrivateKeyPassphrase,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayAuthAccountPrivateKey(): m.Component<
  FormOverlayComponentAttrs<AuthAccountPrivateKey>
> {
  const state = {
    password: "",
    passwordConfirm: "",
    passwordShow: false,
  };

  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          name: AuthAccountState.translate(
            WebFormOverlayAuthAccountPrivateKeyPassphrase,
          ),
          onDelete: async (): Promise<void | Err> => {
            return AuthAccountState.deletePrivateKey(vnode.attrs.data.name);
          },
          onSubmit: async (): Promise<void | Err> => {
            if (state.password !== "") {
              const v = await AuthAccountState.newPrivateKeyPBKDF2(
                state.password,
              );
              if (v !== undefined) {
                vnode.attrs.data.key = v;
              }
            }

            return AuthAccountState.setPrivateKey(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(PermissionComponentsEnum.Auth),
        },
        [
          m(FormItem, {
            input: {
              oninput: (e) => {
                vnode.attrs.data.name = e;
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormItemNewPassword, {
            name: AuthAccountState.translate(
              WebFormOverlayAuthAccountPrivateKeyPassphrase,
            ),
            noAutocomplete: true,
            oninput: (e: string): void => {
              state.password = e;
            },
            value: () => {
              return state.password;
            },
          }),
        ],
      );
    },
  };
}
