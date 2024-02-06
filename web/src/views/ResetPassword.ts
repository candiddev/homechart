import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemNewPassword } from "@lib/components/FormItemNewPassword";
import m from "mithril";

import { API } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import {
  WebGlobalActionResend,
  WebGlobalActionResetPassword,
  WebGlobalActionSignUp,
  WebGlobalEmailAddress,
  WebGlobalPasswordShow,
  WebResetEmailAddressTooltip,
} from "../yaml8n";

export function ResetPassword(): m.Component {
  const state = {
    action: AuthAccountState.translate(WebGlobalActionResetPassword),
    form: AuthAccountState.new(),
    formPasswordVisibility: false,
  };

  return {
    oninit: (): void => {
      if (m.route.param().invite !== undefined) {
        state.action = AuthAccountState.translate(WebGlobalActionSignUp);
      }

      state.form.emailAddress = m.route.param().email;
      state.form.passwordResetToken = m.route.param().token;
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          buttons: [
            {
              name: AuthAccountState.translate(WebGlobalActionResend),
              onclick: async (): Promise<void> => {
                return AuthAccountState.createReset(state.form);
              },
              permitted: true,
              requireOnline: true,
            },
            {
              name: state.action,
              permitted: true,
              requireOnline: true,
              submit: true,
            },
          ],
          onsubmit: async () => {
            return AuthAccountState.updateReset(state.form)
              .then(async () => {
                return AuthAccountState.createSession(
                  state.form,
                  await API.getHostname(),
                );
              })
              .then(async () => {
                return GlobalState.signIn();
              });
          },
          title: {
            name: state.action,
          },
        },
        [
          m(FormItem, {
            input: {
              disabled: true,
              oninput: (e: string): void => {
                state.form.emailAddress = e;
              },
              required: true,
              type: "email",
              value: state.form.emailAddress,
            },
            name: AuthAccountState.translate(WebGlobalEmailAddress),
            tooltip: AuthAccountState.translate(WebResetEmailAddressTooltip),
          }),
          m(FormItemNewPassword, {
            oninput: (e: string): void => {
              state.form.password = e;
            },
            value: () => {
              return state.form.password;
            },
          }),
          m(FormCheckbox, {
            name: AuthAccountState.translate(WebGlobalPasswordShow),
            onclick: () => {
              state.formPasswordVisibility = !state.formPasswordVisibility;
            },
            value: state.formPasswordVisibility,
          }),
        ],
      );
    },
  };
}
