import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import type { BudgetAccount } from "../states/BudgetAccount";
import { BudgetAccountState } from "../states/BudgetAccount";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectAccount, WebFormOverlayBudgetAccountOnBudget, WebGlobalHidden, WebGlobalName, WebGlobalNameTooltip } from "../yaml8n";

export function FormOverlayBudgetAccount (): m.Component<FormOverlayComponentAttrs<BudgetAccount>> {
	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectAccount),
				onDelete: async (): Promise<void | Err> => {
					return BudgetAccountState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<BudgetAccount | void | Err> => {
					if (vnode.attrs.data.id === null) {
						return BudgetAccountState.create(vnode.attrs.data);
					}

					return BudgetAccountState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Budget,
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
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayBudgetAccountOnBudget),
					onclick: () => {
						vnode.attrs.data.budget = ! vnode.attrs.data.budget;
					},
					value: vnode.attrs.data.budget,
				}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebGlobalHidden),
					onclick: () => {
						vnode.attrs.data.hidden = ! vnode.attrs.data.hidden;
					},
					value: vnode.attrs.data.hidden,
				}),
			]);
		},
	};
}
