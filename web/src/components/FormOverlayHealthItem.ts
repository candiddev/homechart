import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import type { HealthItem } from "../states/HealthItem";
import { HealthItemState } from "../states/HealthItem";
import { PermissionComponentsEnum } from "../types/Permission";
import {  ObjectInput, ObjectOutput, WebGlobalHouseholdMember, WebGlobalHouseholdMemberTooltip } from "../yaml8n";

export function FormOverlayHealthItem (): m.Component<FormOverlayComponentAttrs<HealthItem>> {
	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: vnode.attrs.data.output ?
					AuthAccountState.translate(ObjectOutput) :
					AuthAccountState.translate(ObjectInput),
				onDelete: async (): Promise<void | Err> => {
					return HealthItemState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<HealthItem | void | Err> => {
					if (vnode.attrs.data.id === null) {
						return HealthItemState.create(vnode.attrs.data);
					}

					return HealthItemState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true, AuthAccountState.data().primaryAuthHouseholdID),
			}, [
				m(FormItemSelectAuthHouseholdMembers, {
					authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
					memberNames: AuthHouseholdState.findMemberNames(null, true),
					members: vnode.attrs.data.authAccountID === null ?
						[] as string[] :
						[
							vnode.attrs.data.authAccountID,
						],
					name: AuthAccountState.translate(WebGlobalHouseholdMember),
					oninput: (member: NullUUID): void => {
						vnode.attrs.data.authAccountID = member;
					},
					tooltip: AuthAccountState.translate(WebGlobalHouseholdMemberTooltip),
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
					name: "Name",
					tooltip: "Item name",
				}),
				m(FormItemSelectColor, {
					oninput: (e): void => {
						vnode.attrs.data.color = e;
					},
					value: vnode.attrs.data.color,
				}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(ObjectOutput),
					onclick: (): void => {
						vnode.attrs.data.output = ! vnode.attrs.data.output;
					},
					value: vnode.attrs.data.output,
				}),
			]);
		},
	};
}
