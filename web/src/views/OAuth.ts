import "./OAuth.css";

import { Form } from "@lib/components/Form";
import { Markdown } from "@lib/components/Markdown";
import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";
import { UserAgentAPI } from "@lib/types/UserAgent";
import m from "mithril";

import { Logo } from "../components/Logo";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthSessionManager, AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { GetHelp } from "../utilities/GetHelp";
import { WebGlobalActionAllow, WebGlobalActionDeny, WebOAuthGrant, WebOAuthRequest, WebOAuthRequestFooter, WebOAuthUnknown } from "../yaml8n";

enum assistants {
	Unknown,
	Amazon,
	Google,
}

const assistantNames = [
	"",
	"Amazon Alexa",
	"Google Assistant",
];

export const OAuth = (): m.Component => {
	let assistant = assistants.Unknown;

	return {
		oninit: async (): Promise<void> => {
			AppState.toggleLayoutAppMenuOpen(false);

			let redirectURI = "";

			if (m.route.param().redirect_uri !== undefined) {
				redirectURI = m.route.param().redirect_uri;
			}

			switch (m.route.param().client_id) {
			case "amazon_alexa":
				if (redirectURI.startsWith("https://alexa.amazon.co.jp/spa/skill") || redirectURI.startsWith("https://pitangui.amazon.com/spa/skill") || redirectURI.startsWith("https://layla.amazon.com/spa/skill")) {
					assistant = assistants.Amazon;
				}
				break;
			case "google_assistant":
				if (redirectURI.startsWith("https://oauth-redirect.googleusercontent.com/r/")) {
					assistant = assistants.Google;
				}
			}

			if (assistant === assistants.Unknown) {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(WebOAuthUnknown),
				});
				m.route.set("/home");
			}

			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(WebOAuthGrant),
					},
				],
				toolbarActionButtons: [],
			});
		},
		view: (): m.Children => {
			return m(Form, {
				buttons: [
					{
						accent: true,
						name: AuthAccountState.translate(WebGlobalActionDeny),
						onclick: async (): Promise<void> => {
							return new Promise((resolve) => {
								m.route.set("/home");

								return resolve();
							});
						},
						permitted: true,
						requireOnline: true,
					},
					{
						name: AuthAccountState.translate(WebGlobalActionAllow),
						permitted: true,
						requireOnline: true,
						submit: true,
					},
				],
				onsubmit: async () => {
					const expires = Timestamp.now();
					expires.addDays(3650); // 10 years
					const authSession = new AuthSessionManager();
					authSession.data({
						...AuthSessionState.new(),
						...{
							authAccountID: AuthSessionState.data().authAccountID,
							expires: expires.toString(),
							name: assistantNames[assistant],
							userAgent: UserAgentAPI,
						},
					});

					return authSession.create()
						.then(() => {
							window.location.href = `${m.route.param().redirect_uri}#access_token=${InfoState.data().cloud ?
								"" :
								AuthAccountState.data().primaryAuthHouseholdID}_${authSession.data().id}_${authSession.data().key}&token_type=bearer&state=${m.route.param().state}`;
						});
				},
			}, [
				m("div.OAuth", [
					m(Logo),
					m("p.OAuth__title#oauth-title", [
						m("span", assistantNames[assistant]),
						m("br"),
						AuthAccountState.translate(WebOAuthRequest),
					]),
					m(Markdown, {
						value: `${AuthAccountState.translate(WebOAuthRequestFooter)} [Settings > Sessions](/settings/sessions).`,
					}),
				]),
			]);
		},
	};
};
