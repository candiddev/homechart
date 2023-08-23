import "./CookRecipes.css";

import { ButtonArray } from "@lib/components/ButtonArray";
import { DropdownMenu } from "@lib/components/DropdownMenu";
import { FormImportCSV } from "@lib/components/FormImportCSV";
import { Icon } from "@lib/components/Icon";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { StringToID } from "@lib/utilities/StringToID";
import { FormCreated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormImportRecipe } from "../components/FormImportRecipe";
import { FormOverlayCookMealPlan } from "../components/FormOverlayCookMealPlan";
import { FormShopItemIngredients } from "../components/FormShopItemIngredients";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { CookMealPlanState } from "../states/CookMealPlan";
import type { CookRecipe } from "../states/CookRecipe";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import type { CookRecipeFields } from "../utilities/CSVToCookRecipes";
import { CSVToCookRecipes } from "../utilities/CSVToCookRecipes";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectCook, ObjectMealPlan, ObjectRecipes, WebCookRecipesSearch, WebGlobalActionImportRecipeFromWebsite, WebGlobalActionImportRecipes, WebGlobalActionImportRecipesFromCSV, WebGlobalActionShowDeleted, WebGlobalActionShowTag, WebGlobalImage, WebGlobalName, WebGlobalRecipeComplexity, WebGlobalRecipeIngredients, WebGlobalRecipeLastMade, WebGlobalRecipePrepCookTime, WebGlobalRecipeRating, WebGlobalRecipeServings, WebGlobalRecipeTimesMade } from "../yaml8n";

enum visible {
	None,
	CookMealPlan,
	ImportCSV,
	ImportURL,
	ShopItemIngredients,
}

export function CookRecipes (): m.Component {
	function filterIngredients (ingredients: string, filter: string): boolean {
		if (ingredients !== null) {
			if (ingredients.toLowerCase()
				.includes(filter)) {
				return true;
			}
		}
		return false;
	}

	function render (): m.Component<CookRecipe> {
		return {
			view: (vnode): m.Children => {
				return m("div", {
					style: {
						"align-items": "flex-start",
						"display": "flex",
						"flex-direction": "column",
						"width": "100%",
					},
				}, [
					m("div.CookRecipes__name", [
						vnode.attrs.name,
						AppState.isSessionOnline() ?
							m(Icon, {
								classes: "GlobalButtonIconAdd",
								icon: Icons.Add,
								id: `cookrecipe_${StringToID(vnode.attrs.name)}`,
								onclick: async (e: m.Event<MouseEvent>) => {
									e.stopPropagation();

									AppState.setComponentsDropdownMenu(`cookrecipe_${StringToID(vnode.attrs.name)}`, e.clientY);
								},
							}) :
							[],
						m(DropdownMenu, {
							id: `cookrecipe_${StringToID(vnode.attrs.name)}`,
							items: [
								{
									icon: Icons.CookMealPlan,
									name: AuthAccountState.translate(ObjectMealPlan),
									onclick: (): void => {
										AppState.setLayoutAppForm(FormOverlayCookMealPlan, {
											...CookMealPlanState.new(),
											...{
												cookRecipeID: vnode.attrs.id,
											},
										});
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true, vnode.attrs.authHouseholdID),
									requireOnline: true,
								},
								{
									icon: Icons.ShopItem,
									name: AuthAccountState.translate(WebGlobalRecipeIngredients),
									onclick: (): void => {
										m.redraw.sync();
										state.cookMealPlan = CookMealPlanState.new();
										state.cookMealPlan.cookRecipeID = vnode.attrs.id;
										state.formVisible = visible.ShopItemIngredients;
									},
									permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true, vnode.attrs.authHouseholdID),
									requireOnline: true,
								},
							],
						}),
					]),
					m(ButtonArray, {
						icon: Icons.Tag,
						name: "tags",
						onclick: (e): void => {
							state.tag() === e ?
								state.tag("") :
								state.tag(e);
						},
						selected: () => {
							return [
								state.tag(),
							];
						},
						small: true,
						value: vnode.attrs.tags,
					}),
				]);
			},
		};
	}


	const state = {
		columns: Stream<FilterType>({}),
		cookMealPlan: CookMealPlanState.new(),
		deleted: Stream(false as boolean),
		formImportCSVFields: {
			"Complexity": "",
			"Cook Time": "",
			"Directions": "",
			"Ingredients": "",
			"Name": "",
			"Prep Time": "",
			"Rating": "",
			"Servings": "",
			"Source": "",
			"Tags": "",
		} as CookRecipeFields,
		formVisible: visible.None,
		search: Stream(""),
		sort: Stream<TableHeaderSortAttrs>({
			formatter: (c: CookRecipe): string => {
				return c.name;
			},
			invert: false,
			property: "name",
		}),
		tag: Stream(""),
	};

	let recipes: Stream<CookRecipe[]>;

	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("CookRecipes");

			recipes = Stream.lift((recipestate, columns, deleted, search, sort, tag) => {
				const data = CookRecipeState.filter(recipestate, deleted, "", search, tag, (recipe) => {
					return recipe.name.toLowerCase()
						.includes(search.toLowerCase()) || filterIngredients(recipe.ingredients, search.toLowerCase());
				});

				m.redraw();

				return Filter.array(data.data, columns, sort);
			}, CookRecipeState.data, state.columns, state.deleted, state.search, state.sort, state.tag);


			if (m.route.param().tag !== undefined) {
				state.tag(m.route.param().tag);
			}

			if (Object.keys(state.columns()).length === 0) {
				switch (AppState.getSessionDisplay()) {
				case DisplayEnum.XLarge:
					state.columns({
						image: "",
						name: "",
						time: "",
						rating: "", // eslint-disable-line sort-keys
						cookMealPlanLast: "", // eslint-disable-line sort-keys
						cookMealPlanCount: "", // eslint-disable-line sort-keys
					});
					break;
				case DisplayEnum.Large:
					state.columns({
						image: "",
						name: "",
						time: "",
						rating: "", // eslint-disable-line sort-keys
						cookMealPlanLast: "", // eslint-disable-line sort-keys
					});
					break;
				case DisplayEnum.Medium:
				case DisplayEnum.Small:
				case DisplayEnum.XSmall:
					state.columns({
						image: "",
						name: "",
						rating: "",
					});
					break;
				}
			}

			AppState.setLayoutApp({
				...GetHelp("cook"),
				breadcrumbs: [
					{
						link: "/cook/recipes",
						name: AuthAccountState.translate(ObjectCook),
					},
					{
						name: AuthAccountState.translate(ObjectRecipes),
					},
				],
				toolbarActionButtons: [
					AppToolbarActions().newCookRecipe,
					{
						icon: Icons.ImportExport,
						name: AuthAccountState.translate(WebGlobalActionImportRecipeFromWebsite),
						onclick: (): void => {
							state.formVisible = visible.ImportURL;
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
						requireOnline: true,
					},
					{
						icon: Icons.ImportExport,
						name: AuthAccountState.translate(WebGlobalActionImportRecipesFromCSV),
						onclick: (): void => {
							state.formVisible = visible.ImportCSV;
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
						requireOnline: true,
					},
				],
			});


			Telemetry.spanEnd("CookRecipes");
		},
		onremove: (): void => {
			recipes.end(true);
		},
		view: (): m.Children => {
			return [
				m(FormImportCSV, {
					fields: state.formImportCSVFields,
					oninput: (field: string, value: string): void => {
						state.formImportCSVFields[field] = value;
					},
					onsubmit: async (csvData): Promise<void> => {
						await CSVToCookRecipes(csvData, state.formImportCSVFields);
					},
					title: AuthAccountState.translate(WebGlobalActionImportRecipes),
					toggle: (v) => {
						state.formVisible = v ?
							visible.ImportCSV :
							visible.None;
					},
					visible: state.formVisible === visible.ImportCSV,
				}),
				m(FormImportRecipe, {
					toggle: (v): void => {
						state.formVisible = v ?
							visible.ImportURL :
							visible.None;
					},
					visible: state.formVisible === visible.ImportURL,
				}),
				m(FormShopItemIngredients, {
					cookMealPlans: [
						state.cookMealPlan,
					],
					toggle: (v): void => {
						state.formVisible = v ?
							visible.ShopItemIngredients :
							visible.None;
					},
					visible: state.formVisible === visible.ShopItemIngredients,
				}),
				m(Table, {
					actions: [
						{
							icon: Icons.Delete,
							name: AuthAccountState.translate(WebGlobalActionShowDeleted),
							onclick: async (): Promise<void> => {
								return new Promise((resolve) => {
									state.tag("");
									state.deleted(! state.deleted());

									return resolve();
								});
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
							requireOnline: false,
							secondary: state.deleted(),
						},
					],
					data: recipes(),
					editOnclick: (recipe: CookRecipe) => {
						m.route.set(`/cook/recipes/${recipe.id}`);
					},
					filters: [
						{
							icon: Icons.Tag,
							name: AuthAccountState.translate(WebGlobalActionShowTag),
							onclick: (e): void => {
								state.tag() === e ?
									state.tag("") :
									state.tag(e);
							},
							selected: (): string[] => {
								return[
									state.tag(),
								];
							},
							value: CookRecipeState.tagNames(),
						},
					],
					loaded: CookRecipeState.isLoaded(),
					search: {
						onsearch: (e: string): void => {
							state.search(e);
						},
						placeholder: AuthAccountState.translate(WebCookRecipesSearch),
					},
					sort: state.sort,
					tableColumns: [
						{
							name: AuthAccountState.translate(WebGlobalImage),
							noFilter: true,
							noSort: true,
							property: "image",
							type: TableDataType.Image,
						},
						{
							name: AuthAccountState.translate(WebGlobalName),
							property: "name",
							render: render,
							sortFormatter: (c: CookRecipe): string => {
								return c.name;
							},
						},
						{
							name: AuthAccountState.translate(FormCreated),
							noFilter: true,
							property: "created",
							type: TableDataType.Timestamp,
						},
						{
							name: AuthAccountState.translate(WebGlobalRecipeServings),
							property: "servings",
						},
						{
							formatter: (e: CookRecipe): number => {
								return e.timeCook + e.timePrep;
							},
							name: AuthAccountState.translate(WebGlobalRecipePrepCookTime),
							property: "time",
							type: TableDataType.Duration,
						},
						{
							formatter: (e: CookRecipe): string => {
								let icons = "";
								for (let i = 1; i < 6; i++) {
									if (i <= e.rating) {
										icons += `${Icons.RatingSelect} `;
									}
								}

								return icons;
							},
							name: AuthAccountState.translate(WebGlobalRecipeComplexity),
							property: "complexity",
							type: TableDataType.Icon,
						},
						{
							formatter: (e: CookRecipe): string => {
								return `${Icons.RatingSelect} `.repeat(e.rating);
							},
							name: AuthAccountState.translate(WebGlobalRecipeRating),
							property: "rating",
							type: TableDataType.Icon,
						},
						{
							formatter: (e: CookRecipe): string => {
								if (e.cookMealPlanLast === null) {
									return "Never";
								}
								return e.cookMealPlanLast;
							},
							name: AuthAccountState.translate(WebGlobalRecipeLastMade),
							noFilter: true,
							property: "cookMealPlanLast",
						},
						{
							name: AuthAccountState.translate(WebGlobalRecipeTimesMade),
							property: "cookMealPlanCount",
						},
						TableColumnHousehold(),
					],
					tableColumnsNameEnabled: state.columns,
				}),
			];
		},
	};
}
