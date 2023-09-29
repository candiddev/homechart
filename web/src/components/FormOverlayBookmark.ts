import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Icons } from "@lib/types/Icons";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import type { Bookmark } from "../states/Bookmark";
import { BookmarkState } from "../states/Bookmark";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectBookmark, ObjectLink, WebFormOverlayBookmarkIconImage, WebFormOverlayBookmarkIconImageTooltip, WebFormOverlayBookmarkImageIcon, WebFormOverlayBookmarkLinkTooltip, WebFormOverlayBookmarkNewWindow, WebFormOverlayBookmarkShowHome, WebGlobalName, WebGlobalNameTooltip, WebGlobalTags, WebGlobalTagsTooltip } from "../yaml8n";

export function FormOverlayBookmark (): m.Component<FormOverlayComponentAttrs<Bookmark>> {
	let imageLink = false;

	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		oninit: (vnode): void => {
			imageLink = vnode.attrs.data.iconLink !== "";
		},
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectBookmark),
				onDelete: async (): Promise<void | Err> => {
					return BookmarkState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<Bookmark | void | Err> => {
					if (vnode.attrs.data.id === null) {
						return BookmarkState.create(vnode.attrs.data);
					}
					return BookmarkState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Auth,
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
						oninput: (e) => {
							vnode.attrs.data.link = e;
						},
						required: true,
						type: "text",
						value: vnode.attrs.data.link,
					},
					name: AuthAccountState.translate(ObjectLink),
					tooltip: AuthAccountState.translate(WebFormOverlayBookmarkLinkTooltip),
				}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayBookmarkNewWindow),
					onclick: () => {
						vnode.attrs.data.newWindow = !vnode.attrs.data.newWindow;
					},
					value: vnode.attrs.data.newWindow,
				}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayBookmarkShowHome),
					onclick: () => {
						vnode.attrs.data.home = !vnode.attrs.data.home;
					},
					value: vnode.attrs.data.home,
				}),
				imageLink ?
					m(FormItem, {
						input: {
							oninput: (e) => {
								vnode.attrs.data.iconLink = e;
								vnode.attrs.data.iconName = "";
							},
							type: "text",
							value: vnode.attrs.data.iconLink,
						},
						name: AuthAccountState.translate(WebFormOverlayBookmarkIconImage),
						tooltip: AuthAccountState.translate(WebFormOverlayBookmarkIconImageTooltip),
					}) :
					m(FormItemInputIcon, {
						oninput: (icon) => {
							vnode.attrs.data.iconLink = "";
							vnode.attrs.data.iconName = icon;
						},
						value: vnode.attrs.data.iconName,
					}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayBookmarkImageIcon),
					onclick: () => {
						imageLink = !imageLink;
					},
					value: imageLink,
				}),
				m(FormItem, {
					input: {
						datalist: BookmarkState.tagNames(),
						icon: Icons.Tag,
						type: "text",
						value: vnode.attrs.data.tags,
					},
					name: AuthAccountState.translate(WebGlobalTags),
					tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
				}),
			]);
		},
	};
}
