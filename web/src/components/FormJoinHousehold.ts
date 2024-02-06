import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Icons } from "@lib/types/Icons";
import { ActionAdd } from "@lib/yaml8n";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthAccountAuthHouseholdState } from "../states/AuthAccountAuthHousehold";
import type { AuthHousehold } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { SSEState } from "../states/SSE";
import {
  ObjectHousehold,
  WebFormJoinHouseholdJoinToken,
  WebGlobalActionJoin,
} from "../yaml8n";

export interface FormJoinHouseholdAttrs {
  /** Show add button. */
  add?: boolean;
  onjoin?(household: AuthHousehold): void;
}

export function FormJoinHousehold(): m.Component<FormJoinHouseholdAttrs> {
  let token = "";

  return {
    oninit: (): void => {
      const t = localStorage.getItem("token");

      if (t !== null) {
        token = t;
      }
    },
    view: (vnode): m.Children => {
      return m(
        Form,
        {
          buttons: [
            {
              icon: Icons.Add,
              name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectHousehold)}`,
              onclick: async (): Promise<void | Err> => {
                return AuthHouseholdState.create({
                  ...AuthHouseholdState.new(),
                  ...{
                    name: `${AuthAccountState.data().name}'s Household`,
                    subscriptionReferrerCode:
                      AuthAccountState.data().subscriptionReferrerCode,
                  },
                }).then(async (household) => {
                  if (IsErr(household)) {
                    return household;
                  }

                  SSEState.clearRefreshed();
                  await AuthAccountState.read();
                  await AuthSessionState.validate();
                  GlobalState.readAll();

                  if (vnode.attrs.onjoin !== undefined) {
                    vnode.attrs.onjoin(household);
                  }

                  return;
                });
              },
              permitted:
                vnode.attrs.add === true && !AuthAccountState.data().child,
              primary: true,
              requireOnline: true,
            },
          ],
          onsubmit: async () => {
            const household =
              await AuthAccountAuthHouseholdState.inviteAccept(token);
            if (IsErr(household)) {
              return;
            }

            GlobalState.readAll();
            token = "";

            if (vnode.attrs.onjoin !== undefined) {
              vnode.attrs.onjoin(household);
            }
          },
        },
        [
          m(FormItem, {
            input: {
              oninput: (e) => {
                localStorage.removeItem("token");
                token = e;
              },
              required: true,
              type: "text",
              value: token,
            },
            name: AuthAccountState.translate(WebFormJoinHouseholdJoinToken),
            tooltip: AuthAccountState.translate(WebFormJoinHouseholdJoinToken),
          }),
          m(Button, {
            icon: Icons.Invite,
            name: `${AuthAccountState.translate(WebGlobalActionJoin)} ${AuthAccountState.translate(ObjectHousehold)}`,
            permitted: !AuthAccountState.data().child,
            requireOnline: true,
            submit: true,
          }),
        ],
        vnode.children,
      );
    },
  };
}
