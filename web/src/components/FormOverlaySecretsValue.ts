import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputProperties } from "@lib/components/FormItemInputProperties";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import type { RandomizerOptions } from "@lib/utilities/Randomizer";
import { Randomizer } from "@lib/utilities/Randomizer";
import { ActionCancel, ActionNew } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";
import * as OTPAuth from "otpauth";

import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { SecretsValue, SecretsValueData, SecretsValueDecrypted } from "../states/SecretsValue";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectNote, ObjectValue, ObjectValues, ObjectVault, ObjectVersion, WebFormOverlaySecretsValueGenerateValue, WebFormOverlaySecretsValueLength, WebFormOverlaySecretsValueLengthTooltip, WebFormOverlaySecretsValueLowercase, WebFormOverlaySecretsValueNoteTooltip, WebFormOverlaySecretsValueNumbers, WebFormOverlaySecretsValueSpecialCharacters, WebFormOverlaySecretsValueUppercase, WebFormOverlaySecretsValueUseValue, WebFormOverlaySecretsValueValuesTooltip, WebFormOverlaySecretsValueVaultTooltip, WebGlobalActionRestore, WebGlobalName, WebGlobalNameTooltip, WebGlobalTags, WebGlobalTagsTooltip, WebGlobalTOTPCode, WebGlobalVersionTooltip } from "../yaml8n";

export function FormOverlaySecretsValue (): m.Component<FormOverlayComponentAttrs<SecretsValueDecrypted>> {
	const state = {
		formGenerateProperty: "",
		formGenerateVisible: false,
		index: 0,
		updated: Timestamp.now()
			.toString(),
	};

	const randomOpts: Stream<RandomizerOptions> = Stream({
		length: 12,
		noLower: false,
		noNumber: false,
		noSpecial: true,
		noUpper: false,
	} as RandomizerOptions);

	const randomValue = randomOpts.map((opts) => {
		return Randomizer(opts);
	});

	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		oninit: (vnode): void => {
			if (vnode.attrs.data.data.length === 0) {
				vnode.attrs.data.data = [
					{
						updated: state.updated,
					},
				];
			} else {
				vnode.attrs.data.data = [
					{
						...vnode.attrs.data.data[0],
						...{
							updated: state.updated,
						},
					},
					...vnode.attrs.data.data,
				];
			}
		},
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [
					{
						name: AuthAccountState.translate(WebGlobalActionRestore),
						onclick: async (): Promise<void | Err> => {
							if (state.index !== 0) {
								vnode.attrs.data.data = [
									{
										...vnode.attrs.data.data[state.index],
										...{
											updated: state.updated,
										},
									},
									...vnode.attrs.data.data,
								];
							}
							const s = await SecretsValueState.encryptValue(vnode.attrs.data);

							if (! IsErr(s)) {
								return SecretsValueState.update(s)
									.then(() => {
										AppState.setLayoutAppForm();
									});
							}
						},
						permitted: state.index !== 0 && GlobalState.permitted(PermissionComponentsEnum.Secrets),
						primary: true,
						requireOnline: true,
					},
				],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectValue),
				onDelete: async (): Promise<void | Err> => {
					return SecretsValueState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<SecretsValue | void | Err> => {
					if (state.index !== 0) {
						vnode.attrs.data.data = [
							vnode.attrs.data.data[state.index],
							...vnode.attrs.data.data,
						];
					}
					const s = await SecretsValueState.encryptValue(vnode.attrs.data);

					if (!IsErr(s)) {
						if (vnode.attrs.data.id === null) {
							return SecretsValueState.create(s);
						}

						return SecretsValueState.update(s);
					}

					return s;
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Secrets, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItem, {
					name: AuthAccountState.translate(ObjectVault),
					select: {
						oninput: (e: string) => {
							if (SecretsVaultState.keys()[e] !== undefined) {
								vnode.attrs.data.secretsVaultID = e;
							}
						},
						options: SecretsVaultState.data(),
						required: true,
						value: vnode.attrs.data.secretsVaultID,
					},
					tooltip: AuthAccountState.translate(WebFormOverlaySecretsValueVaultTooltip),
				}),
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
				m(FormItem, {
					input: {
						datalist: SecretsValueState.tagNames(),
						icon: Icons.Tag,
						type: "text",
						value: vnode.attrs.data.tags,
					},
					name: AuthAccountState.translate(WebGlobalTags),
					tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
				}),
				vnode.attrs.data.id === null ?
					[] :
					m(FormItem, {
						name: AuthAccountState.translate(ObjectVersion),
						select: {
							oninput: (e: string) => {
								const i = vnode.attrs.data.data.findIndex((v) => {
									return v.updated === e;
								});

								if (i >= 0) {
									state.index = i;
								}
							},
							options: vnode.attrs.data.data.map((data) => {
								return {
									id: data.updated,
									name: data.updated === state.updated ?
										`${AuthAccountState.translate(ActionNew)} ${AuthAccountState.translate(ObjectVersion)}` :
										AppState.formatTimestamp(Timestamp.fromString(data.updated)),
								};
							}),
							value: vnode.attrs.data.data[state.index].updated,
						},
						tooltip: AuthAccountState.translate(WebGlobalVersionTooltip),
					}),
				m(FormItemInputProperties, {
					button: {
						icon: "refresh",
						onclick: (property) => {
							randomOpts(randomOpts());
							state.formGenerateProperty = property;
							state.formGenerateVisible = true;
						},
					},
					data: vnode.attrs.data.data[state.index],
					getKey: (key) => {
						return key;
					},
					getValue: (key) => {
						return vnode.attrs.data.data[state.index][key] as string;
					},
					ignoreKeys: [
						`${AuthAccountState.translate(ObjectNote)}`,
						"updated",
					],
					keyOninput: (key, input) => {
						let data = {};

						for (const property of Object.keys(vnode.attrs.data.data[state.index])) {
							if (key === property) {
								data = {
									...data,
									[input]: vnode.attrs.data.data[state.index][key],
								};
							} else {
								data = {
									...data,
									[property]: vnode.attrs.data.data[state.index][property],
								};
							}
						}

						vnode.attrs.data.data[state.index] = data as SecretsValueData;
					},
					name: AuthAccountState.translate(ObjectValues),
					nameSingle: AuthAccountState.translate(ObjectValue),
					properties: SecretsValueState.properties(),
					tooltip: AuthAccountState.translate(WebFormOverlaySecretsValueValuesTooltip),
					valueMonospace: true,
					valueOninput: (key, input): void => {
						vnode.attrs.data.data[state.index][key] = input;
					},
				}),
				m(FormItem, {
					name: AuthAccountState.translate(ObjectNote),
					textArea: {
						oninput: (e) => {
							vnode.attrs.data.data[state.index].Note = e;
						},
						value: vnode.attrs.data.data.length === 0 || vnode.attrs.data.data[state.index].Note === undefined ?
							"" :
							vnode.attrs.data.data[state.index].Note,
					},
					tooltip: AuthAccountState.translate(WebFormOverlaySecretsValueNoteTooltip),
				}),
				vnode.attrs.data.data.length === 0 || vnode.attrs.data.data[state.index].TOTP === undefined || vnode.attrs.data.data[state.index].TOTP === "" ?
					[] :
					m(FormItem, {
						input: {
							disabled: true,
							oninput: () => {},
							type: "number",
							value: new OTPAuth.TOTP({
								secret: vnode.attrs.data.data[state.index].TOTP,
							})
								.generate(),
						},
						name: AuthAccountState.translate(WebGlobalTOTPCode),
						tooltip: "",
					}),
				state.formGenerateVisible ?
					m(Form, {
						buttons: [
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.formGenerateVisible = false;

										return resolve();
									});
								},
								permitted: true,
								requireOnline: false,
							},
							{
								name: AuthAccountState.translate(WebFormOverlaySecretsValueUseValue),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										vnode.attrs.data.data[state.index][state.formGenerateProperty] = randomValue();
										state.formGenerateVisible = false;

										return resolve();
									});
								},
								permitted: true,
								primary: true,
								requireOnline: false,
							},
						],
						overlay: true,
						title: {
							name: AuthAccountState.translate(WebFormOverlaySecretsValueGenerateValue),
						},
					}, [
						m(FormItem, {
							input: {
								disabled: true,
								monospace: true,
								oninput: () => {},
								type: "text",
								value: randomValue(),
							},
							name: AuthAccountState.translate(ObjectValue),
							tooltip: "",
						}),
						m(FormItem, {
							input: {
								max: 32,
								min: 8,
								oninput: (e) => {
									randomOpts({
										...randomOpts(),
										...{
											length: parseInt(e, 10),
										},
									});
								},
								type: "range",
								value: randomOpts().length,
							},
							name: AuthAccountState.translate(WebFormOverlaySecretsValueLength),
							tooltip: AuthAccountState.translate(WebFormOverlaySecretsValueLengthTooltip),
						}),
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebFormOverlaySecretsValueLowercase),
							onclick: () => {
								randomOpts({
									...randomOpts(),
									...{
										noLower: ! (randomOpts().noLower as boolean),
									},
								});
							},
							topPadding: true,
							value: randomOpts().noLower === false,
						}),
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebFormOverlaySecretsValueUppercase),
							onclick: () => {
								randomOpts({
									...randomOpts(),
									...{
										noUpper: ! (randomOpts().noUpper as boolean),
									},
								});
							},
							value: randomOpts().noUpper === false,
						}),
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebFormOverlaySecretsValueNumbers),
							onclick: () => {
								randomOpts({
									...randomOpts(),
									...{
										noNumber: ! (randomOpts().noNumber as boolean),
									},
								});
							},
							value: randomOpts().noNumber === false,
						}),
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebFormOverlaySecretsValueSpecialCharacters),
							onclick: () => {
								randomOpts({
									...randomOpts(),
									...{
										noSpecial: ! (randomOpts().noSpecial as boolean),
									},
								});
							},
							value: randomOpts().noSpecial === false,
						}),
					]) :
					[],
			]);
		},
	};
}
