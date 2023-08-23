import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputCurrency } from "@lib/components/FormItemInputCurrency";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import { FormRecurrence } from "@lib/components/FormRecurrence";
import { CivilDate } from "@lib/types/CivilDate";
import { Recurrence } from "@lib/types/Recurrence";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { ShopCategoryState } from "../states/ShopCategory";
import type { ShopItem } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectCategory, ObjectList, ObjectListPickUp, ObjectMealPlan, ObjectRecipe, ObjectStore, WebFormItemsShopItemCategoryTooltip, WebFormItemsShopItemListTooltip, WebFormItemsShopItemMakeStaple, WebFormItemsShopItemPrice, WebFormItemsShopItemPriceTooltip, WebFormItemsShopItemPurchaseOnTooltip, WebFormItemsShopItemStoreTooltip, WebGlobalName, WebGlobalNameTooltip } from "../yaml8n";
import { FormItemPlanProject } from "./FormItemPlanProject";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";

interface FormShopItemAttrs {
	data: ShopItem,
}

export function FormShopItem (): m.Component<FormShopItemAttrs> {
	return {
		view: (vnode): m.Children => {
			return [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Shop,
				}),
				m(FormItem, {
					input: {
						markdown: true,
						oninput: (e: string): void => {
							vnode.attrs.data.name = e;
							const category = ShopCategoryState.findMatch(e);
							vnode.attrs.data.shopCategoryID = category.id;
							vnode.attrs.data.budgetPayeeID = category.budgetPayeeID;
						},
						required: true,
						type: "text",
						value: vnode.attrs.data.name,
					},
					name: AuthAccountState.translate(WebGlobalName),
					tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
				}),
				AuthAccountState.data().primaryAuthHouseholdID === null ?
					[] :
					m(FormItemInputCurrency, {
						format: AuthHouseholdState.findID(vnode.attrs.data.authHouseholdID).preferences.currency,
						name: AuthAccountState.translate(WebFormItemsShopItemPrice),
						oninput: (e: number): void => {
							vnode.attrs.data.price = e;
						},
						onlyPositive: true,
						tooltip: AuthAccountState.translate(WebFormItemsShopItemPriceTooltip),
						value: vnode.attrs.data.price,
					}),
				AuthAccountState.data().primaryAuthHouseholdID === null ?
					[] :
					m(FormItem, {
						name: AuthAccountState.translate(ObjectCategory),
						select: {
							oninput: (e: string): void => {
								if (e === "") {
									vnode.attrs.data.shopCategoryID = null;
								} else {
									vnode.attrs.data.shopCategoryID = e;
									vnode.attrs.data.budgetPayeeID = ShopCategoryState.findID(vnode.attrs.data.shopCategoryID).budgetPayeeID;
								}
							},
							options: [
								"",
								...ShopCategoryState.data(),
							],
							required: false,
							value: vnode.attrs.data.shopCategoryID,
						},
						tooltip: AuthAccountState.translate(WebFormItemsShopItemCategoryTooltip),
					}),
				AuthAccountState.data().primaryAuthHouseholdID === null ?
					[] :
					m(FormItem, {
						name: AuthAccountState.translate(ObjectStore),
						select: {
							oninput: (e: string): void => {
								vnode.attrs.data.budgetPayeeID = BudgetPayeeState.findName(e).id;
							},
							options: [
								"",
								...BudgetPayeeState.storeNames(),
							],
							required: false,
							value: BudgetPayeeState.findID(vnode.attrs.data.budgetPayeeID).name,
						},
						tooltip: AuthAccountState.translate(WebFormItemsShopItemStoreTooltip),
					}),
				m(FormItem, {
					name: AuthAccountState.translate(ObjectList),
					select: {
						oninput: (e: string): void => {
							if (e === "Pick Up" || e === "") {
								vnode.attrs.data.shopListID = null;
							} else {
								vnode.attrs.data.shopListID = e;
							}
						},
						options: [
							{
								id: "pickup",
								name: AuthAccountState.translate(ObjectListPickUp),
							},
							...ShopListState.data(),
						],
						required: false,
						value: vnode.attrs.data.shopListID === null ?
							"pickup" :
							vnode.attrs.data.shopListID,
					},
					tooltip: AuthAccountState.translate(WebFormItemsShopItemListTooltip),
				}),
				m(FormItemPlanProject, {
					authAccountID: null,
					authHouseholdID: null,
					oninput: (id: string) => {
						if (id === "" || id === "personal" || id === "household") {
							vnode.attrs.data.planProjectID = null;
						} else {
							vnode.attrs.data.planProjectID = id;
						}
					},
					planProjectID: vnode.attrs.data.planProjectID,
				}),
				vnode.attrs.data.cookMealPlanID === null ?
					[] :
					m(FormItem, {
						input: {
							disabled: true,
							oninput: (): void => {},
							type: "text",
							value: `${CivilDate.fromString(CookMealPlanState.findID(vnode.attrs.data.cookMealPlanID).date as string)
								.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator)} - ${CookMealTimeState.findID(CookMealPlanState.findID(vnode.attrs.data.cookMealPlanID).cookMealTimeID).name}`,
						},
						name: AuthAccountState.translate(ObjectMealPlan),
						tooltip: "",
					}),
				vnode.attrs.data.cookRecipeID === null ?
					[] :
					m(FormItem, {
						input: {
							disabled: true,
							oninput: (): void => {},
							type: "text",
							value: CookRecipeState.findID(vnode.attrs.data.cookRecipeID).name,
						},
						name: AuthAccountState.translate(ObjectRecipe),
						tooltip: "",
					}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormItemsShopItemMakeStaple),
					onclick: () => {
						if (vnode.attrs.data.recurrence === null) {
							vnode.attrs.data.nextDate = CivilDate.now()
								.toJSON();
							vnode.attrs.data.recurrence = Recurrence.new();
						} else {
							vnode.attrs.data.nextDate = null;
							vnode.attrs.data.recurrence = null;
						}
					},
					value: vnode.attrs.data.recurrence !== null,
				}),
				vnode.attrs.data.recurrence === null ?
					[] :
					[
						m(FormItemInputDate, {
							name: AuthAccountState.translate(WebFormItemsShopItemPurchaseOnTooltip),
							oninput: (e: string): void => {
								vnode.attrs.data.nextDate = e;
							},
							tooltip: AuthAccountState.translate(WebFormItemsShopItemPurchaseOnTooltip),
							value: vnode.attrs.data.nextDate,
						}),
						m(FormRecurrence, {
							futureNext: true,
							recurrence: vnode.attrs.data.recurrence,
							startDate: vnode.attrs.data.nextDate,
						}),
					],
			];
		},
	};
}
