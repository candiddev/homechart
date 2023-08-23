import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Clone } from "@lib/utilities/Clone";
import { ActionCancel } from "@lib/yaml8n";
import m from "mithril";
import type Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CloudHouseholdState } from "../states/CloudHousehold";
import { GlobalState } from "../states/Global";
import { InfoState } from "../states/Info";
import { PaymentState } from "../states/Payment";
import { Translations } from "../states/Translations";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { PermissionComponentsEnum } from "../types/Permission";
import { Analytics } from "../utilities/Analytics";
import { WebFormSubscriptionExpires, WebFormSubscriptionExpiresTrial, WebFormSubscriptionReferralCode, WebFormSubscriptionReferralCodeTooltip, WebFormSubscriptionReferralStatus1, WebFormSubscriptionReferralStatus2,WebFormSubscriptionReferralStatus3, WebFormSubscriptionReferralStatus4, WebFormSubscriptionReferrerCode, WebFormSubscriptionReferrerCodeTooltip, WebFormSubscriptionRetryLink, WebFormSubscriptionSelfHostedID, WebFormSubscriptionSelfHostedIDCopied, WebFormSubscriptionSelfHostedIDCopy, WebFormSubscriptionSelfHostedIDTooltip, WebFormSubscriptionStatus, WebFormSubscriptionSubscribeLifetime, WebFormSubscriptionSubscribeMonthly, WebFormSubscriptionTitle, WebGlobalNever, WebGlobalSubscription } from "../yaml8n";
import { TitleTabsAuthHousehold } from "./TitleTabsAuthHouseholds";

export interface FormSubscriptionAttrs {
	/** AuthHouseholdID to manage a subscription for. */
	authHouseholdID: NullUUID,
}

export function FormSubscription (): m.Component<FormSubscriptionAttrs> {
	const state = {
		authHousehold: Clone(AuthHouseholdState.new()),
		expires: (id: NullUUID): string => {
			return InfoState.data().cloud ?
				CivilDate.fromString(AuthHouseholdState.findID(id).subscriptionExpires as string)
					.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator) :
				CloudHouseholdState.findID(id).subscriptionExpires === null ?
					"Unknown" :
					CivilDate.fromString(CloudHouseholdState.findID(id).subscriptionExpires as string)
						.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator);
		},
		loaded: false,
		password: "",
		processor: (id: NullUUID): AuthHouseholdSubscriptionProcessorEnum => {
			return InfoState.data().cloud ?
				AuthHouseholdState.findID(id).subscriptionProcessor :
				CloudHouseholdState.findID(id).subscriptionProcessor;
		},
		showPassword: false,
	};

	PaymentState.prices.map((prices) => {
		if (prices.monthly !== "" && ! state.loaded) {
			state.loaded = true;
			m.redraw();

			return;
		}
	});

	async function updatePrices (): Promise<void> {
		await PaymentState.readPaddle()
			.catch(() => {});
	}

	let s: Stream<Promise<void>>;

	return {
		oninit: async (vnode): Promise<void> => {
			state.loaded = PaymentState.prices().monthly !== "";

			s = AuthHouseholdState.data.map(async () => {
				if (state.authHousehold.id === null) {
					const id = vnode.attrs.authHouseholdID === null ?
						AuthAccountState.data().primaryAuthHouseholdID :
						vnode.attrs.authHouseholdID;

					if (InfoState.data().cloud) {
						state.authHousehold = Clone(AuthHouseholdState.findID(id));
					} else {
						for (const ah of AuthSessionState.data().permissionsHouseholds!) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
							await CloudHouseholdState.read(ah.authHouseholdID)
								.catch(() => {});
						}
						state.authHousehold = Clone(CloudHouseholdState.findID(id));
					}
				}

				if (InfoState.data().cloud || CloudHouseholdState.findID(state.authHousehold.id) !== null) {
					return updatePrices();
				}

				m.redraw();
			});

			state.loaded = true;
		},
		onremove: (): void => {
			s.end(true);
		},
		view: (vnode): m.Children => {
			return m(Form, {
				loaded: state.loaded,
				title:
					{
						name: ! InfoState.data().cloud && CloudHouseholdState.findID(vnode.attrs.authHouseholdID).id === null ?
							AuthAccountState.translate(WebFormSubscriptionTitle) :
							undefined,
						tabs: TitleTabsAuthHousehold(),
					},
			}, [
				InfoState.data().cloud || CloudHouseholdState.findID(vnode.attrs.authHouseholdID).id !== null ?
					[
						m(FormItem, {
							input: {
								disabled: true,
								oninput: (): void => {},
								type: "text",
								value: Translations.subscriptionProcessors[state.processor(vnode.attrs.authHouseholdID)],
							},
							name: AuthAccountState.translate(WebFormSubscriptionStatus),
							tooltip: "",
						}),
						m(FormItem, {
							input: {
								disabled: true,
								oninput: (): void => {},
								type: "text",
								value: state.processor(vnode.attrs.authHouseholdID) === AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime ?
									AuthAccountState.translate(WebGlobalNever) :
									state.expires(vnode.attrs.authHouseholdID),
							},
							name: AuthAccountState.translate(WebFormSubscriptionExpires),
							tooltip: "",
						}),
						state.processor(vnode.attrs.authHouseholdID) === AuthHouseholdSubscriptionProcessorEnum.None ?
							m("p#subscription", {
								style: {
									"filter": "var(--filter_light)",
									"font-weight": "var(--font-weight_bold)",
									"max-width": "var(--width_input)",
									"padding-top": "10px",
									"text-align": "center",
								},
							}, AuthAccountState.translate(WebFormSubscriptionExpiresTrial)) :
							[],
						m("div.Form__buttons", [
							m(Button, {
								accent: true,
								name: `${AuthAccountState.translate(ActionCancel)} ${AuthAccountState.translate(WebGlobalSubscription)}`,
								onclick: async (): Promise<void | Err> => {
									setTimeout(async () => {
										await CloudHouseholdState.readJWT(vnode.attrs.authHouseholdID);
									}, 1000);

									return PaymentState.cancel(vnode.attrs.authHouseholdID);
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) && state.processor(vnode.attrs.authHouseholdID) !== AuthHouseholdSubscriptionProcessorEnum.None && state.processor(vnode.attrs.authHouseholdID) !== AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime,
								requireOnline: true,
							}),
							m(Button, {
								icon: "add",
								iconTop: true,
								name: `${AuthAccountState.translate(WebFormSubscriptionSubscribeMonthly)}
${PaymentState.prices().monthly}`,
								onclick: async (): Promise<void | Err> => {
									if (state.processor(vnode.attrs.authHouseholdID) === AuthHouseholdSubscriptionProcessorEnum.PaddleYearly) {
										return PaymentState.update(vnode.attrs.authHouseholdID, AuthHouseholdSubscriptionProcessorEnum.PaddleMonthly);
									}

									return PaymentState.createPaddle(vnode.attrs.authHouseholdID, AuthHouseholdSubscriptionProcessorEnum.PaddleMonthly)
										.then((response) => {
											if (IsErr(response)) {
												return response;
											}

											Analytics.beginCheckout();
											window.location.href = response.url;

											return;
										})
										.catch(() => {});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) && PaymentState.prices().monthly !== "" && state.processor(vnode.attrs.authHouseholdID) === AuthHouseholdSubscriptionProcessorEnum.None,
								primary: true,
								requireOnline: true,
								target: "_blank",
							}),
							m(Button, {
								icon: "all_inclusive",
								iconTop: true,
								name: `${AuthAccountState.translate(WebFormSubscriptionSubscribeLifetime)}
${PaymentState.prices().lifetime}`,
								onclick: async (): Promise<void | Err> => {

									return PaymentState.createPaddle(vnode.attrs.authHouseholdID, AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime)
										.then((response) => {
											if (IsErr(response)) {
												return response;
											}

											Analytics.beginCheckout();
											window.location.href = response.url;

											return;
										});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) && PaymentState.prices().lifetime !== "" && state.processor(vnode.attrs.authHouseholdID) !== AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime,
								primary: true,
								requireOnline: true,
								target: "_blank",
							}),
						]),
						m(FormItem, {
							input: {
								oninput: (e): void => {
									state.authHousehold.subscriptionReferrerCode = e;

									setTimeout(async () => {
										if (state.authHousehold.subscriptionReferrerCode === e) {
											if (InfoState.data().cloud) {
												return AuthHouseholdState.update(state.authHousehold);
											}
											return CloudHouseholdState.update(state.authHousehold);
										}
									}, 500);
								},
								type: "text",
								value: state.authHousehold.subscriptionReferrerCode,
							},
							name: AuthAccountState.translate(WebFormSubscriptionReferrerCode),
							tooltip: AuthAccountState.translate(WebFormSubscriptionReferrerCodeTooltip),
						}),
						[
							m(FormItem, {
								input: {
									oninput: (e): void => {
										localStorage.removeItem("token");
										state.authHousehold.subscriptionReferralCode = e;

										setTimeout(async () => {
											if (state.authHousehold.subscriptionReferralCode === e) {
												if (InfoState.data().cloud) {
													return AuthHouseholdState.update(state.authHousehold);
												}
												return CloudHouseholdState.update(state.authHousehold);
											}
										}, 500);
									},
									type: "text",
									value: state.authHousehold.subscriptionReferralCode,
								},
								name: AuthAccountState.translate(WebFormSubscriptionReferralCode),
								tooltip: AuthAccountState.translate(WebFormSubscriptionReferralCodeTooltip),
							}),
							m("p#referral", {
								style: {
									"filter": "var(--filter_light)",
									"font-weight": "var(--font-weight_bold)",
									"max-width": "var(--width_input)",
									"padding-top": "5px",
									"text-align": "center",
								},
							}, `${state.authHousehold.subscriptionReferralCount === 0 ?
								"" :
								`${AuthAccountState.translate(WebFormSubscriptionReferralStatus1)} ${state.authHousehold.subscriptionReferralCount} ${AuthAccountState.translate(WebFormSubscriptionReferralStatus2)}.`}${state.authHousehold.subscriptionProcessor === AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime ?
								"" :
								`  ${AuthAccountState.translate(WebFormSubscriptionReferralStatus3)} ${10 - state.authHousehold.subscriptionReferralCount} ${AuthAccountState.translate(WebFormSubscriptionReferralStatus4)}: https://web.homechart.app/signup?referral=${state.authHousehold.subscriptionReferralCode}`}`),
						],
					] :
					[],
				InfoState.data().cloud || CloudHouseholdState.findID(vnode.attrs.authHouseholdID).id === null ?
					[
						m(FormItem, {
							input: {
								disabled: !InfoState.data().cloud,
								oninput: (e): void => {
									if (e === "") {
										state.authHousehold.selfHostedID = null;
									} else {
										state.authHousehold.selfHostedID = e;
									}

									setTimeout(async () => {
										if (state.authHousehold.selfHostedID === e || state.authHousehold.selfHostedID === null) {
											return AuthHouseholdState.update(state.authHousehold);
										}
									}, 500);
								},
								type: "text",
								value: InfoState.data().cloud ?
									state.authHousehold.selfHostedID === null ?
										"" :
										state.authHousehold.selfHostedID :
									AuthHouseholdState.findID(vnode.attrs.authHouseholdID).id,
							},
							name: AuthAccountState.translate(WebFormSubscriptionSelfHostedID),
							tooltip: AuthAccountState.translate(WebFormSubscriptionSelfHostedIDTooltip),
						}),
						InfoState.data().cloud ?
							[] :
							[
								m(Button, {
									name: AuthAccountState.translate(WebFormSubscriptionSelfHostedIDCopy),
									onclick: async () => {
										return navigator.clipboard.writeText(`${AuthHouseholdState.findID(vnode.attrs.authHouseholdID).id}`)
											.then(() => {
												AppState.setLayoutAppAlert({
													message: AuthAccountState.translate(WebFormSubscriptionSelfHostedIDCopied),
												});

												window.open("https://web.homechart.app/subscription", "_blank");
											});
									},
									permitted: true,
									primary: true,
									requireOnline: true,
								}),
								m(Button, {
									name: AuthAccountState.translate(WebFormSubscriptionRetryLink),
									onclick: async () => {
										return CloudHouseholdState.read(vnode.attrs.authHouseholdID)
											.then(async () => {
												await CloudHouseholdState.readJWT(vnode.attrs.authHouseholdID);
												state.authHousehold = Clone(CloudHouseholdState.findID(vnode.attrs.authHouseholdID));

												return updatePrices();
											});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID),
									primary: true,
									requireOnline: true,
								}),
							],
					] :
					[],
			]);
		},
	};
}
