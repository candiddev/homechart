import { FormImage } from "@lib/components/FormImage";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputProperties } from "@lib/components/FormItemInputProperties";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import type { FilterType } from "@lib/types/Filter";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";
import QRCode from "qrcode";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { InventoryItem } from "../states/InventoryItem";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanTaskState } from "../states/PlanTask";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectItem, WebFormOverlayInventoryItemAssociatedTasks, WebFormOverlayInventoryItemProperties, WebFormOverlayInventoryItemPropertiesTooltip, WebFormOverlayInventoryItemProperty, WebFormOverlayInventoryItemQuantity, WebFormOverlayInventoryItemQuantityTooltip, WebFormOverlayInventoryItemUPC, WebFormOverlayInventoryItemUPCTooltip, WebGlobalImage, WebGlobalName, WebGlobalNameTooltip, WebGlobalQRCode } from "../yaml8n";

export function FormOverlayInventoryItem (): m.Component<FormOverlayComponentAttrs<InventoryItem>> {
	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		oninit: async (vnode): Promise<void> => {
			if (vnode.attrs.data.id !== null && vnode.attrs.data.qrlink === undefined) {
				vnode.attrs.data.qrlink = InventoryItemState.getLink(vnode.attrs.data.id);
				vnode.attrs.data.qrcode = await QRCode.toDataURL(vnode.attrs.data.qrlink);
				m.redraw();
			}
		},
		onupdate: async (vnode): Promise<void> => {
			if (vnode.attrs.data.id !== null && vnode.attrs.data.qrlink === undefined) {
				vnode.attrs.data.qrlink = InventoryItemState.getLink(vnode.attrs.data.id);
				vnode.attrs.data.qrcode = await QRCode.toDataURL(vnode.attrs.data.qrlink);
				m.redraw();
			}
		},
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectItem),
				onDelete: async (): Promise<void | Err> => {
					return InventoryItemState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<InventoryItem | void | Err> => {
					if (vnode.attrs.data.id === null) {
						return InventoryItemState.create(vnode.attrs.data);
					}

					return InventoryItemState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Inventory, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Inventory,
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
				m(FormImage, {
					name: AuthAccountState.translate(WebGlobalImage),
					oninput: (image: string) => {
						vnode.attrs.data.image = image;
					},
					value: vnode.attrs.data.image,
				}),
				m(FormItem, {
					input: {
						min: 0,
						oninput: (e: string): void => {
							const int = parseInt(e, 10);

							if (e === "") {
								vnode.attrs.data.quantity = 0;
							} else if (! isNaN(int)) {
								vnode.attrs.data.quantity = int;
							}
						},
						required: true,
						type: "number",
						value: vnode.attrs.data.quantity,
					},
					name: AuthAccountState.translate(WebFormOverlayInventoryItemQuantity),
					tooltip: AuthAccountState.translate(WebFormOverlayInventoryItemQuantityTooltip),
				}),
				m(FormItemInputProperties, {
					data: vnode.attrs.data.properties,
					getKey: (key): string => {
						return key;
					},
					getValue: (key): string => {
						return vnode.attrs.data.properties[key] as string;
					},
					keyOninput: (key, input): void => {
						let data: FilterType = {};

						for (const property of Object.keys(vnode.attrs.data.properties)) {
							if (key === property) {
								data = {
									...data,
									[input]: vnode.attrs.data.properties[key],
								};
							} else {
								data = {
									...data,
									[property]: vnode.attrs.data.properties[property],
								};
							}
						}

						vnode.attrs.data.properties = data;
					},
					keyValues: (key): string[] => {
						return InventoryItemState.findPropertyValues(key);
					},
					name: AuthAccountState.translate(WebFormOverlayInventoryItemProperties),
					nameSingle: AuthAccountState.translate(WebFormOverlayInventoryItemProperty),
					properties: InventoryItemState.properties(),
					tooltip: AuthAccountState.translate(WebFormOverlayInventoryItemPropertiesTooltip),
					valueOninput: (key, input): void => {
						vnode.attrs.data.properties[key] = input;
					},
				}),
				m(FormItem, {
					input: {
						oninput: (e: string): void => {
							vnode.attrs.data.upc = e;
						},
						type: "text",
						value: vnode.attrs.data.upc,
					},
					name: AuthAccountState.translate(WebFormOverlayInventoryItemUPC),
					tooltip: AuthAccountState.translate(WebFormOverlayInventoryItemUPCTooltip),
				}),
				PlanTaskState.findInventoryItemID(vnode.attrs.data.id).length > 0 ?
					m(FormItem, {
						name: AuthAccountState.translate(WebFormOverlayInventoryItemAssociatedTasks),
						textArea: {
							disabled: true,
							oninput: () => {},
							value: PlanTaskState.findInventoryItemID(vnode.attrs.data.id)
								.map((item) => {
									return `#plantask/${item.shortID}`;
								})
								.join("\n"),
						},
						tooltip: "",
					}) :
					[],
				vnode.attrs.data.id === null ?
					[] :
					m(FormImage, {
						disabled: true,
						name: AuthAccountState.translate(WebGlobalQRCode),
						onclick: () => {
							const image = new Image();
							image.src = vnode.attrs.data.qrcode as string;

							const w = window.open("");
							(w as Window).document.write(image.outerHTML);
						},
						oninput: () => {},
						text: vnode.attrs.data.qrlink,
						value: vnode.attrs.data.qrcode,
					}),
			]);
		},
	};
}
