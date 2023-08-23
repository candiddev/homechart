import "./SignIn.css";

import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { Or } from "@lib/components/Or";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { CheckForm } from "@lib/utilities/CheckForm";
import { FormItemNewPasswordPassword } from "@lib/yaml8n";
import m from "mithril";

import { FormContactUs } from "../components/FormContactUs";
import { Logo } from "../components/Logo";
import { OIDCButtons } from "../components/OIDCButtons";
import { API, apiEndpoint } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import { InfoState } from "../states/Info";
import { OIDCState } from "../states/OIDC";
import { ObjectMessageSent, WebGlobalActionShowPassword, WebGlobalActionSignIn, WebGlobalActionSignInWith, WebGlobalActionSignUp, WebGlobalActionSignUpWith, WebGlobalEmailAddress, WebGlobalSelfHostedAddress, WebGlobalSelfHostedAddressTooltip, WebGlobalTOTPCode, WebGlobalTOTPCodeTooltip, WebSignInForgotPassword, WebSignInLegal1, WebSignInLegal2, WebSignInLegal3, WebSignInLegal4, WebSignInLegal5, WebSignInReferralCode, WebSignInReferralCodeTooltip, WebSignInRememberMe, WebSignInTryDemo } from "../yaml8n";

export function SignIn (): m.Component {
	const state = {
		demo: false,
		formPasswordVisibility: false,
		hostname: "",
		initSelfHosted: false,
		loaded: false,
		referral: false,
		selfHostedServer: false,
		timer: 0,
	};

	return {
		oninit: async (): Promise<void> => {
			document.title = "Homechart - Sign In";
			state.hostname = await API.getHostname();

			if (AppState.isSessionAuthenticated()) {
				m.route.set("/home", {}, {
					replace: true,
				});
			}

			await InfoState.read();
			await OIDCState.readProviders();

			if (! InfoState.data().cloud && state.hostname === "") {
				state.initSelfHosted = true;
			}

			state.demo = InfoState.data().demo === true;
			state.loaded = true;
			m.redraw();
		},
		view: (): m.Children => {
			return state.loaded ?
				m(Form, {
					center: true,
					loaded: state.loaded,
					onsubmit: async () => {
						AuthAccountState.data().tosAccepted = true;

						if (CheckForm("")) {
							if (m.route.get()
								.includes("/signin")) {
								return AuthAccountState.createSession(AuthAccountState.data(), state.hostname)
									.then(async (err) => {
										if (IsErr(err)) {
											if (err.message === "Incorrect passcode") {
												AuthAccountState.data().totpEnabled = true;

												return;
											}

											AppState.setLayoutAppAlert(err);

											return err;
										}

										return GlobalState.signIn();
									});
							}
							if (m.route.get()
								.includes("/signup")) {
								return AuthAccountState.createAccount({
									...AuthAccountState.data(),
									...{
										subscriptionReferrerCode: localStorage.getItem("referral") === null ?
											"" :
											localStorage.getItem("referral") as string,
									},
								}, state.hostname)
									.then(async (err) => {
										if (IsErr(err)) {
											return err;
										}

										return GlobalState.signIn()
											.then(() => {
											});
									});
							}

						}
					},
				}, [
					state.initSelfHosted ?
						[] :
						m("i.SignIn__selfhosted#self-hosted", {
							class: state.selfHostedServer ?
								"SignIn__selfhosted--enabled" :
								undefined,
							onclick: () => {
								state.selfHostedServer = !state.selfHostedServer;
							},
						}, "settings"),
					m(Logo),
					state.selfHostedServer || apiEndpoint().hostname !== "" && apiEndpoint().hostname !== "https://web.homechart.app" ?
						m(FormItem, {
							input: {
								oninput: async (e: string): Promise<void> => {
									clearTimeout(state.timer);
									state.hostname = e;
									state.timer = window.setTimeout(async () => {

										if (e === state.hostname) {
											API.setHostname(e);

											await InfoState.read(true);
											await OIDCState.readProviders(true);

											m.redraw();
										}
									}, 500);
								},
								type: "url",
								value: state.hostname,
							},
							name: AuthAccountState.translate(WebGlobalSelfHostedAddress),
							tooltip: AuthAccountState.translate(WebGlobalSelfHostedAddressTooltip),
						}) :
						[],
					m(FormItem, {
						input: {
							autocomplete: "username",
							oninput: (e: string): void => {
								AuthAccountState.data().emailAddress = e;
							},
							required: true,
							type: "text",
							value: AuthAccountState.data().emailAddress,
						},
						name: AuthAccountState.translate(WebGlobalEmailAddress),
						tooltip: "",
					}),
					m(FormItem, {
						input: {
							autocomplete: "current-password",
							oninput: (e: string): void => {
								AuthAccountState.data().password = e;
							},
							required: true,
							type: state.formPasswordVisibility ?
								"text" :
								"password",
							value: AuthAccountState.data().password,
						},
						name: AuthAccountState.translate(FormItemNewPasswordPassword),
						tooltip: "",
					}),
					m.route.get()
						.includes("/signin") ?
						m("div.SignIn__forgot.GlobalLink", {
							id: "forgot-password",
							onclick: async (): Promise<void> => {
								return AuthAccountState.createReset(AuthAccountState.data())
									.catch((err) => {
										AppState.setLayoutAppAlert({
											message: err.message === "Item not found" ?
												AuthAccountState.translate(ObjectMessageSent) :
												err.message,
										});
									});
							},
						}, m("span", AuthAccountState.translate(WebSignInForgotPassword))) :
						[],
					m(FormCheckbox, {
						name: AuthAccountState.translate(WebGlobalActionShowPassword),
						onclick: () => {
							state.formPasswordVisibility = !state.formPasswordVisibility;
						},
						value: state.formPasswordVisibility,
					}),
					m(FormCheckbox, {
						name: AuthAccountState.translate(WebSignInRememberMe),
						onclick: () => {
							AuthAccountState.data().rememberMe = ! (AuthAccountState.data().rememberMe as boolean);
						},
						value: AuthAccountState.data().rememberMe === undefined ?
							false :
							AuthAccountState.data().rememberMe,
					}),
					AuthAccountState.data().totpEnabled !== undefined && AuthAccountState.data().totpEnabled ?
						m(FormItem, {
							input: {
								autocomplete: "one-time-code",
								inputmode: "numeric",
								oninput: (e: string): void => {
									AuthAccountState.data().totpCode = e;
								},
								required: true,
								type: "text",
								value: AuthAccountState.data().totpCode,
							},
							name: AuthAccountState.translate(WebGlobalTOTPCode),
							tooltip: AuthAccountState.translate(WebGlobalTOTPCodeTooltip),
						}) :
						[],
					m.route.get()
						.includes("/signup") ?
						m(FormCheckbox, {
							name: `${AuthAccountState.translate(WebSignInReferralCode)}?`,
							onclick: () => {
								state.referral = ! state.referral;
							},
							value: state.referral,
						}) :
						[],
					state.referral ?
						m(FormItem, {
							input: {
								oninput: (e: string): void => {
									localStorage.setItem("referral", e);
								},
								type: "text",
								value: localStorage.getItem("referral") === null ?
									"" :
									localStorage.getItem("referral"),
							},
							name: AuthAccountState.translate(WebSignInReferralCode),
							tooltip: AuthAccountState.translate(WebSignInReferralCodeTooltip),
						}) :
						[],
					m("div.SignIn__buttons", [
						m(Button, {
							name: m.route.get()
								.includes("/signin") ?
								`${AuthAccountState.translate(WebGlobalActionSignInWith)} ${AuthAccountState.translate(WebGlobalEmailAddress)}` :
								`${AuthAccountState.translate(WebGlobalActionSignUpWith)} ${AuthAccountState.translate(WebGlobalEmailAddress)}`,
							permitted: InfoState.data().version !== "",
							requireOnline: true,
							submit: true,
						}),
						InfoState.data().version === "" ?
							[] :
							m(Or),
						m(OIDCButtons, {
							disabled: false,
							or: true,
						}),
						m(Button, {
							href: m.route.get()
								.includes("/signin") ?
								"/signup" :
								"/signin",
							name: m.route.get()
								.includes("/signin") ?
								AuthAccountState.translate(WebGlobalActionSignUp) :
								AuthAccountState.translate(WebGlobalActionSignIn),
							options: {
								state: {
									key: Date.now(),
								},
							},
							permitted: InfoState.data().version !== "",
							requireOnline: true,
							secondary: true,
						}),
						m(Button, {
							accent: true,
							href: "/demo",
							name: AuthAccountState.translate(WebSignInTryDemo),
							permitted: state.demo,
							requireOnline: true,
						}),
					]),
					m.route.get()
						.includes("/signup") ?
						m("p.SignIn__terms", {
							id: "terms",
						}, [
							m("span", `${AuthAccountState.translate(WebSignInLegal1)} ${AuthAccountState.translate(WebGlobalActionSignUp)}, ${AuthAccountState.translate(WebSignInLegal2)} `),
							m("a.GlobalLink", {
								href: "/about/terms",
								target: "_blank",
							}, AuthAccountState.translate(WebSignInLegal3)),
							m("span", ` ${AuthAccountState.translate(WebSignInLegal4)} `),
							m("a.GlobalLink", {
								href: "/about/privacy",
								target: "_blank",
							}, AuthAccountState.translate(WebSignInLegal5)),
						]) :
						[],
					m(FormContactUs),
				]) :
				[];
		},
	};
}
