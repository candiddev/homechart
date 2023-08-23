import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormImage } from "@lib/components/FormImage";
import { FormItem } from "@lib/components/FormItem";
import { FormItemNewPassword } from "@lib/components/FormItemNewPassword";
import { Table } from "@lib/components/Table";
import { Title } from "@lib/components/Title";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { OIDCProviderType, OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";
import { ActionCancel, ActionUpdate, FormItemNewPasswordPassword } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormAuthAccountPreferences } from "../components/FormAuthAccountPreferences";
import { FormOverlayAuthAccountPrivateKey } from "../components/FormOverlayAuthAccountPrivateKey";
import { OIDCButtons } from "../components/OIDCButtons";
import { TableComponents } from "../components/TableComponents";
import type { AuthAccountPrivateKey } from "../states/AuthAccount";
import { AuthAccountPrivateKeyProviderPasswordPBKDF2, AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { ContactState } from "../states/Contact";
import { GlobalState } from "../states/Global";
import { PaymentState } from "../states/Payment";
import { SSEState } from "../states/SSE";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectAccount, WebFormContactUsButtonFeedback, WebFormOverlayAuthAccountPrivateKeyPassphrase, WebGlobalActionResendVerificationEmail, WebGlobalHideComponents, WebGlobalName, WebGlobalPreferences, WebGlobalQRCode, WebGlobalSettings, WebGlobalTOTPCode, WebGlobalTOTPCodeTooltip, WebGlobalUsername, WebSettingsAccountDeleteAccount, WebSettingsAccountDeleteAccountConfirm, WebSettingsAccountDisableTOTP, WebSettingsAccountPrivateKey, WebSettingsAccountPrivateKeyAdd, WebSettingsAccountPrivateKeyLock, WebSettingsAccountPrivateKeyName, WebSettingsAccountPrivateKeyPassphraseRemember, WebSettingsAccountPrivateKeyPassphrases, WebSettingsAccountPrivateKeyReset, WebSettingsAccountPrivateKeyResetConfirm1, WebSettingsAccountPrivateKeyResetConfirm2, WebSettingsAccountPrivateKeyResetConfirm3, WebSettingsAccountPrivateKeyUnlock, WebSettingsAccountPrivateKeyUnlockFail, WebSettingsAccountRemoveSignIn, WebSettingsAccountSecurity, WebSettingsAccountSetupTOTP, WebSettingsAccountShowBackupCode, WebSettingsAccountTOTPBackupCode, WebSettingsAccountTOTPSecretEntry } from "../yaml8n";

enum tabs {
	preferences,
	components,
	security,
	delete,
}

function setLayoutApp (): void {
	AppState.setLayoutApp({
		...GetHelp("settings#account"),
		breadcrumbs: [
			{
				link: "/settings/account",
				name: AuthAccountState.translate(WebGlobalSettings),
			},
			{
				name: AuthAccountState.translate(ObjectAccount),
			},
		],
		toolbarActionButtons: AuthAccountState.privateKey() === "" ?
			[] :
			[
				{
					icon: Icons.SecretsValue,
					name: AuthAccountState.translate(WebSettingsAccountPrivateKey),
					onclick: (): void => {
						AppState.setLayoutAppForm(FormOverlayAuthAccountPrivateKey, {
							id: null,
							key: "",
							name: "",
							provider: AuthAccountPrivateKeyProviderPasswordPBKDF2,
						});
					},
					permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true),
					requireOnline: true,
				},
			],
	});
}


export function SettingsAccount (): m.Component {
	let authAccount = AuthAccountState.data();
	const state = {
		delete: false,
		deleteFeedback: {
			emailAddress: AuthAccountState.data().emailAddress,
			message: "",
			type: 1,
			url: "",
		},
		erasePrivateKey1: false,
		erasePrivateKey2: false,
		erasePrivateKey3: false,
		formPasswordShow: false,
		passphrase: "",
		rememberPassphrase: true,
		tab: tabs.preferences,
	};

	const columns = Stream<FilterType>({
		name: "",
	});

	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("SettingsAccount");

			if (m.route.param().security !== undefined) {
				state.tab = tabs.security;
			}

			setLayoutApp();

			authAccount = AuthAccountState.data();
		},
		onremove: async (): Promise<void> => {
			return AuthAccountState.load()
				.then(() => {
					m.redraw();
				});
		},
		view: (): m.Children => {
			return [
				m(Form, {
					buttons: state.tab === tabs.preferences ?
						[
							{
								name: AuthAccountState.translate(WebGlobalActionResendVerificationEmail),
								onclick: async (): Promise<void> => {
									return AuthAccountState.readVerify();
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && ! AuthAccountState.data().verified && ! AuthAccountState.data().child,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(ActionUpdate),
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true),
								requireOnline: true,
								submit: true,
							},
						] :
						state.tab === tabs.security ?
							[
								{
									accent: true,
									name: `${AuthAccountState.translate(WebSettingsAccountRemoveSignIn)} ${OIDCProviderType.values[AuthAccountState.data().oidcProviderType]}`,
									onclick: async (): Promise<void> => {
										return new Promise((resolve) => {
											state.formPasswordShow = true;
											return resolve();
										});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().oidcProviderType !== 0 && ! state.formPasswordShow,
									requireOnline: true,
								},
								{
									accent: true,
									name: AuthAccountState.translate(WebSettingsAccountDisableTOTP),
									onclick: async (): Promise<void> => {
										return AuthAccountState.updateTOTP({
											...AuthAccountState.data(),
											...{
												totpSecret: "",
											},
										})
											.then(() => {
												authAccount.totpBackup = "";
											});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().totpEnabled === true,
									requireOnline: true,
								},
								{
									name: AuthAccountState.translate(WebSettingsAccountShowBackupCode),
									onclick: async (): Promise<void | Err> => {
										return AuthAccountState.readTOTPBackup()
											.then((data) => {
												if (!IsErr(data)) {
													authAccount.totpBackup = data;
												}
											});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().totpEnabled === true,
									requireOnline: true,
									secondary: authAccount.totpBackup !== "",
								},
								{
									name: AuthAccountState.translate(WebSettingsAccountSetupTOTP),
									onclick: async (): Promise<void | Err> => {
										return AuthAccountState.createTOTP()
											.then((data) => {
												if (!IsErr(data)) {
													authAccount.totpQR = data.totpQR;
													authAccount.totpSecret = data.totpSecret;
												}
											});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().totpEnabled !== true && authAccount.totpSecret === "" && AuthAccountState.data().oidcProviderType === OIDCProviderTypeEnum.None,
									primary: true,
									requireOnline: true,
								},
								{
									name: AuthAccountState.translate(ActionCancel),
									onclick: async (): Promise<void> => {
										authAccount.totpQR = "";
										authAccount.totpSecret = "";
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && authAccount.totpSecret !== "",
									requireOnline: true,
								},
								{
									name: AuthAccountState.translate(WebSettingsAccountSetupTOTP),
									onclick: async (): Promise<void> => {
										return AuthAccountState.updateTOTP(authAccount)
											.then(() => {
												authAccount.totpCode = "";
												authAccount.totpQR = "";
												authAccount.totpSecret = "";
											});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && authAccount.totpSecret !== "",
									primary: true,
									requireOnline: true,
								},
							] :
							state.tab === tabs.delete ?
								[
									{
										accent: ! state.delete,
										name: state.delete ?
											AuthAccountState.translate(ActionCancel) :
											AuthAccountState.translate(WebSettingsAccountDeleteAccount),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.delete = !state.delete;
												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true),
										requireOnline: true,
									},
									{
										accent: true,
										name: AuthAccountState.translate(WebSettingsAccountDeleteAccountConfirm),
										onclick: async (): Promise<void> => {
											if (state.deleteFeedback.message !== "") {
												await ContactState.create(state.deleteFeedback);
											}

											SSEState.reset();

											const members = AuthHouseholdState.members()
												.filter((member) => {
													return member.child === false;
												});

											if (members.length === 1 && AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).subscriptionProcessor !== AuthHouseholdSubscriptionProcessorEnum.None && AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).subscriptionProcessor !== AuthHouseholdSubscriptionProcessorEnum.PaddleLifetime) {
												await PaymentState.cancel(AuthAccountState.data().primaryAuthHouseholdID);
											}

											return AuthAccountState.delete()
												.then(async () => {
													return GlobalState.signOut();
												});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && state.delete,
										requireOnline: true,
									},
								] :
								[],
					onsubmit: async () => {
						switch (state.tab) {
						case tabs.preferences:
							return AuthAccountState.update(authAccount);
						case tabs.security:
							AppState.setComponentsButtonLoading("Update Password");
							return AuthAccountState.update(authAccount)
								.then(() => {
									authAccount.password = "";
									m.redraw();
								});
						default:
							return;
						}
					},
					title: {
						tabs: [
							{
								active: state.tab === tabs.preferences,
								name: AuthAccountState.translate(WebGlobalPreferences),
								onclick: (): void => {
									state.tab = tabs.preferences;
								},
							},
							{
								active: state.tab === tabs.components,
								name: AuthAccountState.translate(WebGlobalHideComponents),
								onclick: (): void => {
									state.tab = tabs.components;
								},
							},
							...AuthAccountState.data().child ?
								[] :
								[
									{
										active: state.tab === tabs.security,
										name: AuthAccountState.translate(WebSettingsAccountSecurity),
										onclick: (): void => {
											state.tab = tabs.security;
										},
									},
									{
										active: state.tab === tabs.delete,
										name: AuthAccountState.translate(WebSettingsAccountDeleteAccount),
										onclick: (): void => {
											state.tab = tabs.delete;
										},
									},
								],
						],
					},
				}, state.tab === tabs.preferences ?
					[
						m(FormAuthAccountPreferences, {
							authAccount: authAccount,
						}),
					] :
					state.tab === tabs.components ?
						m(TableComponents) :
						state.tab === tabs.security ?
							[
								AuthAccountState.privateKey() === "" ?
									m(Form, {
										buttons: [
											{
												accent: true,
												name: AuthAccountState.translate(WebSettingsAccountPrivateKeyReset),
												onclick: async (): Promise<void> => {
													state.erasePrivateKey1 = true;
													return;
												},
												permitted: AuthAccountState.data().publicKey !== "" && ! state.erasePrivateKey1,
												requireOnline: false,
											},
											{
												name: AuthAccountState.data().publicKey === "" ?
													AuthAccountState.translate(WebSettingsAccountPrivateKeyAdd) :
													AuthAccountState.translate(WebSettingsAccountPrivateKeyUnlock),
												onclick: async (): Promise<void | Err> => {
													if (AuthAccountState.data().publicKey === "") {
														return AuthAccountState.newPrivatePublicKey(`${AuthAccountState.translate(WebSettingsAccountPrivateKeyName)} ${AppState.formatCivilDate(CivilDate.now())}`, state.passphrase)
															.then(() => {
																setLayoutApp();
															});
													}

													return AuthAccountState.decryptPrivateKeys(state.passphrase)
														.then(async () => {
															if (AuthAccountState.privateKey() === "") {
																AppState.setLayoutAppAlert({
																	message: AuthAccountState.translate(WebSettingsAccountPrivateKeyUnlockFail),
																});
															} else {
																setLayoutApp();

																if (state.rememberPassphrase) {
																	return AuthAccountState.savePrivateKey();
																}
															}
														});
												},
												permitted: true,
												primary: true,
												requireOnline: false,
											},
											{
												name: AuthAccountState.translate(ActionCancel),
												onclick: async (): Promise<void> => {
													state.erasePrivateKey1 = false;
													state.erasePrivateKey2 = false;
													state.erasePrivateKey3 = false;
													return;
												},
												permitted: state.erasePrivateKey1,
												primary: true,
												requireOnline: false,
											},
											{
												accent: true,
												name: state.erasePrivateKey3 ?
													AuthAccountState.translate(WebSettingsAccountPrivateKeyResetConfirm3) :
													state.erasePrivateKey2 ?
														AuthAccountState.translate(WebSettingsAccountPrivateKeyResetConfirm2) :
														AuthAccountState.translate(WebSettingsAccountPrivateKeyResetConfirm1),
												onclick: async (): Promise<void> => {
													if (state.erasePrivateKey2 === false) {
														state.erasePrivateKey2 = true;

														return;
													}

													if (state.erasePrivateKey3 === false) {
														state.erasePrivateKey3 = true;

														return;
													}

													return AuthAccountState.updatePrivatePublicKeys({
														...AuthAccountState.data(),
														...{
															privateKeys: [],
															publicKey: "",
														},
													})
														.then(() => {
															state.erasePrivateKey1 = false;
															state.erasePrivateKey2 = false;
															state.erasePrivateKey3 = false;
															setLayoutApp();
														});
												},
												permitted: state.erasePrivateKey1,
												requireOnline: false,
											},
										],
										title: {
											name: AuthAccountState.translate(WebSettingsAccountPrivateKey),
										},
									}, [
										m(FormItemNewPassword, {
											name: AuthAccountState.translate(WebFormOverlayAuthAccountPrivateKeyPassphrase),
											noAutocomplete: true,
											noConfirm: AuthAccountState.data().publicKey !== "",
											noNew: AuthAccountState.data().publicKey !== "",
											oninput: (p) => {
												state.passphrase = p;
											},
											value: () => {
												return state.passphrase;
											},
										}),
										m(FormCheckbox, {
											name: AuthAccountState.translate(WebSettingsAccountPrivateKeyPassphraseRemember),
											onclick: () => {
												state.rememberPassphrase = ! state.rememberPassphrase;
											},
											value: state.rememberPassphrase,
										}),
									]) :
									m(Table, {
										actions: AuthAccountState.privateKey() === "" ?
											[] :
											[
												{
													accent: true,
													name: AuthAccountState.translate(WebSettingsAccountPrivateKeyLock),
													onclick: async (): Promise<void | Err> => {
														AuthAccountState.privateKey("");

														return AuthAccountState.savePrivateKey();
													},
													permitted: true,
													requireOnline: false,
												},
											],
										data: AuthAccountState.keys(),
										editOnclick: (s: AuthAccountPrivateKey) => {
											AppState.setLayoutAppForm(FormOverlayAuthAccountPrivateKey, s);
										},
										filters: [],
										loaded: true,
										noFilters: true,
										staticColumns: true,
										tableColumns: [
											{
												name: AuthAccountState.translate(WebGlobalName),
												property: "name",
											},
										],
										tableColumnsNameEnabled: columns,
										title: {
											name: AuthAccountState.translate(WebSettingsAccountPrivateKeyPassphrases),
										},
									}),
								AuthAccountState.data().oidcProviderType === 0 || state.formPasswordShow ?
									[
										m(Title, {
											name: AuthAccountState.translate(FormItemNewPasswordPassword),
										}),
										m(FormItem, {
											hidden: true,
											input: {
												autocomplete: "username",
												hidden: true,
												oninput: (): void => {},
												type: "email",
												value: authAccount.emailAddress,
											},
											name: AuthAccountState.translate(WebGlobalUsername),
											tooltip: "",
										}),
										m(FormItemNewPassword, {
											name: AuthAccountState.translate(FormItemNewPasswordPassword),
											oninput: (p) => {
												authAccount.password = p;
											},
											value: () => {
												return authAccount.password;
											},
										}),
										m(Button, {
											name: AuthAccountState.translate(ActionUpdate),
											permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().oidcProviderType === 0 || state.formPasswordShow,
											requireOnline: true,
											submit: true,
										}),
										AuthAccountState.data().oidcProviderType === 0 ?
											m(OIDCButtons, {
												disabled: false,
											}) :
											[],
										[
											authAccount.totpBackup === "" ?
												[] :
												m(FormItem, {
													input: {
														disabled: true,
														inputmode: "numeric",
														oninput: (): void => {},
														type: "text",
														value: authAccount.totpBackup,
													},
													name: AuthAccountState.translate(WebSettingsAccountTOTPBackupCode),
													tooltip: "",
												}),
											authAccount.totpQR === "" ?
												[] :
												m(FormImage, {
													disabled: true,
													name: AuthAccountState.translate(WebGlobalQRCode),
													oninput: () => {},
													value: `data:image/png;base64, ${authAccount.totpQR}`,
												}),
											authAccount.totpSecret === "" ?
												[] :
												[
													m(FormItem, {
														input: {
															disabled: true,
															oninput: (): void => {},
															type: "text",
															value: authAccount.totpSecret,
														},
														name: AuthAccountState.translate(WebSettingsAccountTOTPSecretEntry),
														tooltip: "",
													}),
													m(FormItem, {
														input: {
															inputmode: "numeric",
															oninput: (e: string): void => {
																authAccount.totpCode = e;
															},
															type: "text",
															value: authAccount.totpCode,
														},
														name: AuthAccountState.translate(WebGlobalTOTPCode),
														tooltip: AuthAccountState.translate(WebGlobalTOTPCodeTooltip),
													}),

												],
										],
									] :
									[],
							] :
							state.tab === tabs.delete ?
								[
									m(FormItem, {
										name: `${AuthAccountState.translate(WebFormContactUsButtonFeedback)}?`,
										textArea: {
											oninput: (e: string): void => {
												state.deleteFeedback.message = e;
											},
											value: state.deleteFeedback.message,
										},
										tooltip: "",
									}),
								] :
								[],
				),
			];
		},
	};
}
