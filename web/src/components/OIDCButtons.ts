import "./OIDCButtons.css";

import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Color } from "@lib/types/Color";
import { OIDCProviderType } from "@lib/types/OIDCProviderType";
import m from "mithril";

import Google from "../images/google.png?format=webp";
import { AuthAccountState } from "../states/AuthAccount";
import { OIDCAction, OIDCState } from "../states/OIDC";
import { WebGlobalActionSignInWith, WebGlobalActionSignUpWith } from "../yaml8n";

export interface OIDCButtonsAttrs {
	/** Are the buttons disabled? */
	disabled: boolean,

	/** Should an Or spot be inserted above, if there are buttons. */
	or?: boolean,

	/** Should this be for sign up? */
	signup?: boolean,
}

export function OIDCButtons (): m.Component<OIDCButtonsAttrs> {
	return {
		oninit: async (): Promise<void> => {
			return OIDCState.readProviders();
		},
		view: (vnode): m.Children => {
			return m("div.OIDCButtons", OIDCState.data()
				.map((provider) => {
					return m("button.OIDCButtons__button", {
						disabled: vnode.attrs.disabled,
						id: `button-${OIDCProviderType.values[provider].toLowerCase()}`,
						onclick: async () => {
							return OIDCState.readRedirect(provider)
								.then(async (response) => {
									if (IsErr(response)) {
										return response;
									}

									await OIDCState.set({
										action: m.route.get()
											.includes("/settings/account") ?
											OIDCAction.Update :
											OIDCAction.SignIn,
										redirects: AppState.getSessionRedirects(),
										state: response.state,
										type: provider,
									});

									window.location.href = response.url;

									return;
								});
						},
						style: {
							color: Color.content.black,
						},
						type: "button",
					}, [
						m("img.OIDCButtons__img", {
							alt: OIDCProviderType.values[provider],
							src: Google,
						}),
						m("p", `${m.route.get()
							.includes("/signup") ?
							AuthAccountState.translate(WebGlobalActionSignUpWith) :
							AuthAccountState.translate(WebGlobalActionSignInWith)
						} ${OIDCProviderType.values[provider]}`),
					]);
				}));
		},
	};
}
