import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import { NewAESKey } from "@lib/encryption/AES";
import { EncryptionTypeRSA2048, EncryptValue } from "@lib/encryption/Encryption";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import type { SecretsVault } from "../states/SecretsVault";
import { SecretsVaultState } from "../states/SecretsVault";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectVault, WebFormOverlaySecretsVaultHouseholdAccess, WebFormOverlaySecretsVaultHouseholdAccessTooltip, WebGlobalName, WebGlobalNameTooltip } from "../yaml8n";
import { FormItemSelectAuthHouseholdMembers } from "./FormItemSelectAuthHouseholdMembers";

export function FormOverlaySecretsVault (): m.Component<FormOverlayComponentAttrs<SecretsVault>> {
	let denied = false;
	let initMembers: string[] = [];

	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		oninit: (vnode): void => {
			denied = vnode.attrs.data.id !== null && SecretsVaultState.findKeyIndex(vnode.attrs.data.keys, AuthAccountState.data().id) < 0;

			if (vnode.attrs.data.keys.length === 0) {
				initMembers.push(AuthAccountState.data().id as string);
			} else {
				initMembers = vnode.attrs.data.keys.map((key) => {
					return key.authAccountID;
				});
			}
		},
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectVault),
				onDelete: async (): Promise<void> => {
					return SecretsVaultState.delete(vnode.attrs.data.id)
						.then(() => {
							if (m.route.get()
								.includes(`/secrets/${vnode.attrs.data.id}`)) {
								m.route.set("/secrets", "", {
									state: {
										key: Date.now(),
									},
								});
							}
						});
				},
				onSubmit: async (): Promise<SecretsVault | void | Err> => {
					let key: string | Err = SecretsVaultState.keys()[`${vnode.attrs.data.id}`];
					if (key === undefined) {
						key = await NewAESKey();
						if (IsErr(key)) {
							return key;
						}
					}

					vnode.attrs.data.keys = [];

					for (let i = 0; i < initMembers.length; i++) {
						const v = await EncryptValue(EncryptionTypeRSA2048, initMembers[i] === AuthAccountState.data().id ?
							AuthAccountState.data().publicKey :
							AuthHouseholdState.findMember(initMembers[i]).publicKey, key);

						if (! IsErr(v)) {
							vnode.attrs.data.keys.push({
								authAccountID: initMembers[i],
								key: v.string(),
							});
						}
					}

					return vnode.attrs.data.id === null ?
						SecretsVaultState.create(vnode.attrs.data) :
						SecretsVaultState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Secrets, true, vnode.attrs.data.authHouseholdID) && ! denied,
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Secrets,
				}),
				m(FormItem, {
					input: {
						oninput: (e: string): void => {
							vnode.attrs.data.name = e;
						},
						required: true,
						type: "text",
						value: vnode.attrs.data.name,
					},
					name: AuthAccountState.translate(WebGlobalName),
					tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
				}),
				m(FormItemInputIcon, {
					oninput: (e: string): void => {
						vnode.attrs.data.icon = e;
					},
					value: vnode.attrs.data.icon,
				}),
				vnode.attrs.data.authAccountID === null ?
					m(FormItemSelectAuthHouseholdMembers, {
						authHouseholdID: vnode.attrs.data.authHouseholdID,
						memberNames: AuthHouseholdState.members()
							.reduce((names, member) => {
								if (member.authHouseholdID === vnode.attrs.data.authHouseholdID && member.publicKey !== "") {
									names.push(member.name);
								}

								return names;
							}, [] as string[]),
						members: initMembers,
						multiple: true,
						name: AuthAccountState.translate(WebFormOverlaySecretsVaultHouseholdAccess),
						oninput: (members: string[]): void => {
							if (denied) {
								return;
							}

							initMembers = members;

							if (initMembers.findIndex((member) => {
								return member === AuthAccountState.data().id;
							}) < 0) {
								initMembers.push(AuthAccountState.data().id as string);
							}
						},
						tooltip: AuthAccountState.translate(WebFormOverlaySecretsVaultHouseholdAccessTooltip),
					}) :
					[],
			]);
		},
	};
}
