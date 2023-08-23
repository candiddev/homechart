import { Form } from "@lib/components/Form";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { UUID } from "@lib/types/UUID";
import { ActionAdd, ActionCancel, ActionDelete, ActionUpdate } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import type { CookMealPlan } from "../states/CookMealPlan";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { ShopCategoryState } from "../states/ShopCategory";
import type { ShopItem } from "../states/ShopItem";
import { ShopItemState } from "../states/ShopItem";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectCategory, ObjectItem, ObjectRecipe, ObjectShop, ObjectStore, WebFormShopItemIngredientsAddSelectedItemsToPickUp, WebFormShopItemIngredientsAddSelectedItemsToPickUpSuccess, WebFormShopItemIngredientsTitle, WebGlobalName } from "../yaml8n";
import { FormShopItem } from "./FormItemsShopItem";

export interface FormShopItemIngredientsAttrs {
	/** A list of meal plans to generate ingredients from. */
	cookMealPlans: CookMealPlan[],
	toggle(visible: boolean): void,

	/** Show/hide the form. */
	visible: boolean,
}

export function FormShopItemIngredients (): m.Component<FormShopItemIngredientsAttrs> {
	const state = {
		columns: Stream<FilterType>({
			add: "",
			name: "",
			shopCategoryID: "",
		}),
		data: Stream([] as ShopItem[]),
		form: {
			data: ShopItemState.new(),
			visible: false,
		},
		sort: Stream({
			invert: false,
			property: "name",
		}),
	};


	if (AppState.getSessionDisplay() > 1) {
		state.columns = Stream<FilterType>({
			add: "",
			name: "",
			shopCategoryID: "",
			cookRecipeID: "", // eslint-disable-line sort-keys
		});
	}

	const d: Stream<ShopItem[]> = Stream.lift((columns, data, sort) => {
		return Filter.array(data, columns, sort);
	}, state.columns, state.data, state.sort);

	return {
		view: (vnode): m.Children => {
			return vnode.attrs.visible ?
				[
					m(Form, {
						buttons: [
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										vnode.attrs.toggle(false);

										return resolve();
									});
								},
								permitted: true,
								requireOnline: true,
							},
							{
								name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectItem)}`,
								onclick: async (): Promise<void> => {
									return new Promise((resolve): void => {
										state.form.data = ShopItemState.new();
										state.form.visible = true;

										return resolve();
									});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true),
								primary: true,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(WebFormShopItemIngredientsAddSelectedItemsToPickUp),
								onclick: async (): Promise<void> => {
									return new Promise((resolve): void => {
										state.data()
											.map(async (item: ShopItem): Promise<void> => {
												if (item.add === true) {
													delete item.add;
													item.id = null;
													await ShopItemState.create(item, true);
													AppState.setLayoutAppAlert({
														message: AuthAccountState.translate(WebFormShopItemIngredientsAddSelectedItemsToPickUpSuccess),
													});
												}
											});

										vnode.attrs.toggle(false);
										return resolve();
									});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true),
								primary: true,
								requireOnline: true,
							},
						],
						oninit: (): void => {
							state.data(CookMealPlanState.toShopItems(vnode.attrs.cookMealPlans));
							m.redraw();
						},
						overlay: true,
						title: {
							name: AuthAccountState.translate(WebFormShopItemIngredientsTitle),
						},
					}, m(Table, {
						actions: [],
						data: d(),
						editOnclick: (s: ShopItem) => {
							state.form.data = s;
							state.form.visible = true;
						},
						filters: [],
						loaded: true,
						noNewButton: true,
						sort: state.sort,
						tableColumns: [
							{
								checkboxOnclick: async (d: ShopItem): Promise<void> => {
									return new Promise((resolve) => {
										const i = state.data()
											.findIndex((s) => {
												return s.id === d.id;
											});

										state.data()[i].add = d.add !== true;

										return resolve();
									});
								},
								name: `${AuthAccountState.translate(ActionAdd)}?`,
								permitted: (d: ShopItem): boolean => {
									return GlobalState.permitted(PermissionComponentsEnum.Shop, true, d.authHouseholdID);
								},
								property: "add",
								type: TableDataType.Checkbox,
							},
							{
								name: AuthAccountState.translate(WebGlobalName),
								property: "name",
							},
							{
								formatter: (e: ShopItem): string => {
									return ShopCategoryState.findID(e.shopCategoryID).name;
								},
								name: AuthAccountState.translate(ObjectCategory),
								property: "shopCategoryID",
							},
							{
								formatter: (e: ShopItem): string => {
									return BudgetPayeeState.findID(e.budgetPayeeID).name;
								},
								linkFormatter: (e: ShopItem): string => {
									return  `/shop/items?store=${e.budgetPayeeID}`;
								},
								name: AuthAccountState.translate(ObjectStore),
								property: "shopStoreID",
								type: TableDataType.Link,
							},
							{
								formatter: (e: ShopItem): string => {
									return CookRecipeState.findID(e.cookRecipeID).name;
								},
								name: AuthAccountState.translate(ObjectRecipe),
								property: "cookRecipeID",
							},
						],
						tableColumnsNameEnabled: state.columns,
					})),
					state.form.visible ?
						m(Form, {
							buttons: [
								{
									accent: true,
									name: AuthAccountState.translate(ActionDelete),
									onclick: async (): Promise<void> => {
										return new Promise((resolve) => {
											const d = state.data();
											const i = d.findIndex((item) => {
												return item.id === state.form.data.id;
											});
											d.splice(i, 1);
											state.data(d);
											state.form.visible = false;

											return resolve();
										});
									},
									permitted: state.form.data.id !== null,
									requireOnline: true,
								},
								{
									name: AuthAccountState.translate(ActionCancel),
									onclick: async (): Promise<void> => {
										return new Promise((resolve) => {
											state.form.visible = false;

											return resolve();
										});
									},
									permitted: true,
									requireOnline: true,
								},
								{
									name: `${state.form.data.id === null ?
										AuthAccountState.translate(ActionAdd):
										AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectItem)}`,
									permitted: true,
									requireOnline: true,
									submit: true,
								},
							],
							onsubmit: async (): Promise<void> => {
								return new Promise((resolve): void => {
									if (state.form.data.id === null) {
										state.form.data.add = true;
										state.form.data.id = UUID.new();
										const d = state.data();
										d.push(state.form.data);
										state.data(d);
									} else {
										const d = state.data();
										const index = d
											.findIndex((item: ShopItem) => {
												return item.id === state.form.data.id;
											});
										d[index] = state.form.data;
										state.data(d);
									}

									state.form.visible = false;

									return resolve();
								});
							},
							overlay: true,
							title: {
								name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectShop)} ${AuthAccountState.translate(ObjectItem)}`,
							},
						}, m(FormShopItem, {
							data: state.form.data,
						})) :
						[],
				] :
				[];
		},
	};
}
