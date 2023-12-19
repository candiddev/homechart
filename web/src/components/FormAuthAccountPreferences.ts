import { Button } from "@lib/components/Button";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormExpander } from "@lib/components/FormExpander";
import { FormItem } from "@lib/components/FormItem";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import type { CivilDateSeparatorEnum } from "@lib/types/CivilDate";
import { CivilDate, CivilDateSeparator } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";
import { StringToID } from "@lib/utilities/StringToID";
import { WeekdayMonday, WeekdaySunday } from "@lib/yaml8n";
import m from "mithril";

import type { AuthAccount } from "../states/AuthAccount";
import { AuthAccountState } from "../states/AuthAccount";
import { ISO639Codes, WebGlobalEmailAddress, WebGlobalLanguage, WebGlobalName, WebGlobalTimeZone, WebSettingsAccountAccentColor, WebSettingsAccountColorTheme, WebSettingsAccountDarkMode, WebSettingsAccountDateOrder, WebSettingsAccountDateOrderTooltip, WebSettingsAccountDateSeparator, WebSettingsAccountDateSeparatorTooltip, WebSettingsAccountEmailAddressTooltip, WebSettingsAccountLanguageDateTime, WebSettingsAccountLanguageTooltip, WebSettingsAccountNameTooltip, WebSettingsAccountNegativeColor, WebSettingsAccountPositiveColor, WebSettingsAccountPrimaryColor, WebSettingsAccountRandomizeColors, WebSettingsAccountSecondaryColor, WebSettingsAccountStartWeek, WebSettingsAccountStartWeekTooltip, WebSettingsAccountTimeFormat, WebSettingsAccountTimeFormatTooltip, WebSettingsAccountTimeZoneTooltip } from "../yaml8n";

interface FormAuthAccountPreferencesAttrs {
	authAccount: AuthAccount,
}

function getRandomColor (): number {
	return Math.floor(Math.random() * (Object.keys(ColorEnum).length - 1)) + 1;
}

export function FormAuthAccountPreferences (): m.Component<FormAuthAccountPreferencesAttrs> {
	const c = CivilDate.now();

	let dateOrder = getDateOrder(AuthAccountState.data().preferences.formatDateSeparator);
	let expandColor = false;
	let expandDateTime = false;
	let timezones: string[] = [];

	function getDateOrder (separator: CivilDateSeparatorEnum): string[] {
		return [
			`${c.getMonth()}${CivilDateSeparator[separator]}${c.getDay()}${CivilDateSeparator[separator]}${c.getYear()}`,
			`${c.getDay()}${CivilDateSeparator[separator]}${c.getMonth()}${CivilDateSeparator[separator]}${c.getYear()}`,
			`${c.getYear()}${CivilDateSeparator[separator]}${c.getMonth()}${CivilDateSeparator[separator]}${c.getDay()}`,
		];
	}

	return {
		oninit: async (): Promise<void> => {
			const tz = (await import("moment-timezone")).default.tz as any; // eslint-disable-line @typescript-eslint/no-explicit-any

			timezones = tz.names()
				.map((t: string) => {
					return {
						id: t,
						name: `${t.replace(/_/g, " ")} (${tz(t)
							.format("hh:mm A")})`,
					};
				});
		},
		view: (vnode): m.Children => {
			return [
				vnode.attrs.authAccount.child || AuthAccountState.isDemo() ?
					[] :
					m(FormItem, {
						input: {
							oninput: (e: string): void => {
								vnode.attrs.authAccount.emailAddress = e;
							},
							type: "email",
							value: vnode.attrs.authAccount.emailAddress,
						},
						name: AuthAccountState.translate(WebGlobalEmailAddress),
						tooltip: AuthAccountState.translate(WebSettingsAccountEmailAddressTooltip),
					}),
				m(FormItem, {
					input: {
						disabled: vnode.attrs.authAccount.child,
						oninput: (e: string): void => {
							vnode.attrs.authAccount.name = e;
						},
						type: "text",
						value: vnode.attrs.authAccount.name,
					},
					name: AuthAccountState.translate(WebGlobalName),
					tooltip: AuthAccountState.translate(WebSettingsAccountNameTooltip),
				}),
				m(FormExpander, {
					expand: expandDateTime,
					name: AuthAccountState.translate(WebSettingsAccountLanguageDateTime),
					onclick: () => {
						expandDateTime = !expandDateTime;
					},
				}),
				expandDateTime ?
					[
						m(FormItem, {
							name: AuthAccountState.translate(WebGlobalLanguage),
							select: {
								oninput: (e: string): void => {
									AuthAccountState.data({
										...AuthAccountState.data(),
										...{
											iso639Code: e,
										},
									});
									vnode.attrs.authAccount.iso639Code = e;

									m.redraw();
								},
								options: Object.keys(ISO639Codes)
									.map((key) => {
										return {
											id: key,
											name: ISO639Codes[key],
										};
									}),
								value: vnode.attrs.authAccount.iso639Code,
							},
							tooltip: AuthAccountState.translate(WebSettingsAccountLanguageTooltip),
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebGlobalTimeZone),
							select: {
								oninput: (e: string): void => {
									vnode.attrs.authAccount.timeZone = e;
								},
								options: timezones,
								value: vnode.attrs.authAccount.timeZone,
							},
							tooltip: AuthAccountState.translate(WebSettingsAccountTimeZoneTooltip),
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebSettingsAccountDateOrder),
							select: {
								oninput: (e: string): void => {
									const o = dateOrder.indexOf(e);

									if (o >= 0) {
										vnode.attrs.authAccount.preferences.formatDateOrder = o;
									}
								},
								options: dateOrder,
								value: dateOrder[vnode.attrs.authAccount.preferences.formatDateOrder],
							},
							tooltip: AuthAccountState.translate(WebSettingsAccountDateOrderTooltip),
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebSettingsAccountDateSeparator),
							select: {
								oninput: (e: string): void => {
									vnode.attrs.authAccount.preferences.formatDateSeparator = CivilDateSeparator.indexOf(e);
									dateOrder = getDateOrder(vnode.attrs.authAccount.preferences.formatDateSeparator);
									m.redraw.sync();
									(document.getElementById(`form-item-select${StringToID(AuthAccountState.translate(WebSettingsAccountDateOrder))}`) as HTMLInputElement).value = dateOrder[vnode.attrs.authAccount.preferences.formatDateOrder];
									m.redraw();
								},
								options: CivilDateSeparator,
								value: CivilDateSeparator[vnode.attrs.authAccount.preferences.formatDateSeparator],
							},
							tooltip: AuthAccountState.translate(WebSettingsAccountDateSeparatorTooltip),
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebSettingsAccountStartWeek),
							select: {
								oninput: (e: string): void => {
									vnode.attrs.authAccount.preferences.formatWeek8601 = e === "yes";
								},
								options: [
									{
										id: "no",
										name: AuthAccountState.translate(WeekdaySunday),
									},
									{
										id: "yes",
										name: AuthAccountState.translate(WeekdayMonday),
									},
								],
								value: vnode.attrs.authAccount.preferences.formatWeek8601 ?
									"yes" :
									"no",
							},
							tooltip:  AuthAccountState.translate(WebSettingsAccountStartWeekTooltip),
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebSettingsAccountTimeFormat),
							select: {
								oninput: (e: string): void => {
									vnode.attrs.authAccount.preferences.formatTime24 = e === "21:00";
								},
								options: [
									"21:00",
									"9:00 PM",
								],
								value: vnode.attrs.authAccount.preferences.formatTime24 ?
									"21:00" :
									"9:00 PM",
							},
							tooltip: AuthAccountState.translate(WebSettingsAccountTimeFormatTooltip),
						}),
					] :
					[],
				m(FormExpander, {
					expand: expandColor,
					name: AuthAccountState.translate(WebSettingsAccountColorTheme),
					onclick: () => {
						expandColor = !expandColor;
					},
				}),
				expandColor ?
					[
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebSettingsAccountDarkMode),
							onclick: () => {
								vnode.attrs.authAccount.preferences.darkMode = !vnode.attrs.authAccount.preferences.darkMode;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											darkMode: vnode.attrs.authAccount.preferences.darkMode,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.darkMode,
						}),
						m(FormItemSelectColor, {
							name: AuthAccountState.translate(WebSettingsAccountPrimaryColor),
							oninput: (e): void => {
								vnode.attrs.authAccount.preferences.colorPrimary = e;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											colorPrimary: vnode.attrs.authAccount.preferences.colorPrimary,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.colorPrimary,
						}),
						m(Button, {
							disabled: true,
							name: AuthAccountState.translate(WebSettingsAccountPrimaryColor),
							onclick: async (): Promise<void> => {},
							permitted: true,
							primary: true,
							requireOnline: false,
						}),
						m(FormItemSelectColor, {
							name: AuthAccountState.translate(WebSettingsAccountSecondaryColor),
							oninput: (e): void => {
								vnode.attrs.authAccount.preferences.colorSecondary = e;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											colorSecondary: vnode.attrs.authAccount.preferences.colorSecondary,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.colorSecondary,
						}),
						m(Button, {
							disabled: true,
							name: AuthAccountState.translate(WebSettingsAccountSecondaryColor),
							onclick: async (): Promise<void> => {},
							permitted: true,
							requireOnline: false,
							secondary: true,
						}),
						m(FormItemSelectColor, {
							name: AuthAccountState.translate(WebSettingsAccountAccentColor),
							oninput: (e): void => {
								vnode.attrs.authAccount.preferences.colorAccent = e;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											colorAccent: vnode.attrs.authAccount.preferences.colorAccent,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.colorAccent,
						}),
						m(Button, {
							accent: true,
							disabled: true,
							name: AuthAccountState.translate(WebSettingsAccountAccentColor),
							onclick: async (): Promise<void> => {},
							permitted: true,
							requireOnline: false,
						}),
						m(FormItemSelectColor, {
							name: AuthAccountState.translate(WebSettingsAccountPositiveColor),
							oninput: (e): void => {
								vnode.attrs.authAccount.preferences.colorPositive = e;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											colorPositive: vnode.attrs.authAccount.preferences.colorPositive,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.colorPositive,
						}),
						m(FormItemSelectColor, {
							name: AuthAccountState.translate(WebSettingsAccountNegativeColor),
							oninput: (e): void => {
								vnode.attrs.authAccount.preferences.colorNegative = e;
								AuthAccountState.data({
									...AuthAccountState.data(),
									...{
										preferences: {
											...AuthAccountState.data().preferences,
											colorNegative: vnode.attrs.authAccount.preferences.colorNegative,
										},
									},
								});
								m.redraw();
							},
							value: vnode.attrs.authAccount.preferences.colorNegative,
						}),
						m(Button, {
							name: AuthAccountState.translate(WebSettingsAccountRandomizeColors),
							onclick: async (): Promise<void> => {
								return new Promise((resolve) => {
									const accent = getRandomColor();
									let primary = getRandomColor();
									let secondary = getRandomColor();

									while (primary === accent || primary === secondary) {
										primary = getRandomColor();
									}

									while (secondary === accent) {
										secondary = getRandomColor();
									}

									console.log(getRandomColor());

									const darkMode = Math.random() < 0.5;

									vnode.attrs.authAccount.preferences.colorAccent = Object.keys(ColorEnum)[accent];
									vnode.attrs.authAccount.preferences.colorPrimary = Object.keys(ColorEnum)[primary];
									vnode.attrs.authAccount.preferences.colorSecondary = Object.keys(ColorEnum)[secondary];
									vnode.attrs.authAccount.preferences.darkMode = darkMode;

									AuthAccountState.data({
										...AuthAccountState.data(),
										...{
											preferences: {
												...AuthAccountState.data().preferences,
												colorAccent: vnode.attrs.authAccount.preferences.colorAccent,
												colorPrimary: vnode.attrs.authAccount.preferences.colorPrimary,
												colorSecondary: vnode.attrs.authAccount.preferences.colorSecondary,
												darkMode: darkMode,
											},
										},
									});
									m.redraw();

									return resolve();
								});
							},
							permitted: true,
							requireOnline: false,
						}),
					] :
					[],
			];
		},
	};
}
