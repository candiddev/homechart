import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { Table } from "@lib/components/Table";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Default } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayShopCategory } from "../components/FormOverlayShopCategory";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import type { ShopCategory } from "../states/ShopCategory";
import { ShopCategoryState } from "../states/ShopCategory";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectCategories, ObjectCategory, ObjectShop, ObjectStore, WebFormOverlayShopCategoryMatch, WebGlobalName, WebShopCategoriesMatchOutput, WebShopCategoriesTest, WebShopCategoriesTestTooltip } from "../yaml8n";

export function ShopCategories (): m.Component {
	const state = {
		columns: Stream<FilterType>({
			name: "",
			match: "", // eslint-disable-line
			shopStoreID: "",
		}),
		formShopCategoryVisible: false,
		matchInput: "",
		matchOutput: AuthAccountState.translate(WebShopCategoriesMatchOutput),
		sort: Stream({
			invert: false,
			property: "name",
		}),
	};

	let data: Stream<ShopCategory[]>;

	return {
		oninit: async (): Promise<void> => {
			data = Stream.lift((categories, columns, sort) => {
				return Filter.array(categories, columns, sort);
			}, ShopCategoryState.data, state.columns, state.sort);

			AppState.setLayoutApp({
				...GetHelp("shop"),
				breadcrumbs: [
					{
						link: "/shop/items",
						name: AuthAccountState.translate(ObjectShop),
					},
					{
						name: AuthAccountState.translate(ObjectCategories),
					},
				],
				toolbarActionButtons: [
					AppToolbarActions().newShopCategory,
				],
			});
		},
		onremove: (): void => {
			data.end(true);
		},
		view: (): m.Children => {
			return [
				m(Form, [
					m(FormItem, {
						input: {
							oninput: (e: string): void => {
								state.matchInput = e;
								const output = ShopCategoryState.findMatch(e).name;
								if (output === "") {
									state.matchOutput = "No matches";
								}
								state.matchOutput = output;
							},
							type: "text",
							value: state.matchInput,
						},
						name: AuthAccountState.translate(WebShopCategoriesTest),
						tooltip: AuthAccountState.translate(WebShopCategoriesTestTooltip),
					}),
					m(FormItem, {
						input: {
							disabled: true,
							oninput: (): void => {},
							type: "text",
							value: state.matchOutput,
						},
						name: AuthAccountState.translate(ObjectCategory),
						tooltip: "",
					}),
				]),
				m(Table, {
					actions: [],
					data: data(),
					editOnclick: (s: ShopCategory) => {
						AppState.setLayoutAppForm(FormOverlayShopCategory, s);
					},
					filters: [],
					loaded: BudgetPayeeState.isLoaded() && ShopCategoryState.isLoaded(),
					sort: state.sort,
					tableColumns: [
						{
							name: AuthAccountState.translate(WebGlobalName),
							property: "name",
						},
						{
							formatter: (e: ShopCategory): string => {
								if (e.match !== "") {
									let match = e.match.split("|");
									if (match.length > 4) {
										match = match.slice(0, 4);
										match.push("...");
									}
									return match.join("\n");
								}
								return "";
							},
							name: AuthAccountState.translate(WebFormOverlayShopCategoryMatch),
							property: "match",
						},
						{
							formatter: (e: ShopCategory): string => {
								return BudgetPayeeState.findID(e.budgetPayeeID).name;
							},
							name: `${AuthAccountState.translate(Default)} ${AuthAccountState.translate(ObjectStore)}`,
							property: "shopStoreID",
						},
						TableColumnHousehold(),
					],
					tableColumnsNameEnabled: state.columns,
				}),
			];
		},
	};
}
