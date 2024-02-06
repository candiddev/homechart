import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { GetHelp } from "../utilities/GetHelp";

export function Switch(): m.Component {
  return {
    oninit: async (): Promise<void> => {
      AppState.setLayoutApp({
        ...GetHelp(),
        breadcrumbs: [
          {
            name: "Switch Account",
          },
        ],
        toolbarActionButtons: [],
      });
    },
    onremove: async (): Promise<void> => {
      return AuthAccountState.load().then(() => {
        m.redraw();
      });
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          title: {},
        },
        [
          m(FormItem, {
            name: "Select Child",
            select: {
              oninput: async (e: string): Promise<void | Err> => {
                const member = AuthHouseholdState.findMember(e);
                AuthSessionState.data().authAccountID = member.id;

                return GlobalState.switch();
              },
              options: AuthHouseholdState.findMemberNames(null, true).filter(
                (item) => {
                  return item !== AuthAccountState.data().name;
                },
              ),
              required: true,
              value:
                AuthAccountState.data().name === ""
                  ? AuthAccountState.data().emailAddress
                  : AuthAccountState.data().name,
            },
            tooltip: "",
          }),
        ],
      );
    },
  };
}
