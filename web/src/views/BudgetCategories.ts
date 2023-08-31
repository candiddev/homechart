import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { UUID } from "@lib/types/UUID";
import { YearMonth } from "@lib/types/YearMonth";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBudgetCategory } from "../components/FormOverlayBudgetCategory";
import { TitleTabsAuthHousehold } from "../components/TitleTabsAuthHouseholds";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { BudgetMonth } from "../states/BudgetMonth";
import { BudgetMonthState } from "../states/BudgetMonth";
import type { BudgetMonthCategory } from "../states/BudgetMonthCategory";
import { BudgetMonthCategoryState } from "../states/BudgetMonthCategory";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectBudget, ObjectBudgetCategoryGroupingIncome, ObjectCategories, ObjectCategory, ObjectChange, WebBudgetCategoriesCarryover, WebBudgetCategoriesRemaining, WebFormOverlayBudgetCategoryTargetAmount, WebGlobalActionBudgetTargetAmount, WebGlobalBudgetBalance, WebGlobalBudgeted, WebGlobalHidden } from "../yaml8n";

export function BudgetCategories (): m.Component {
	const state: {
		collapsedCategories: Stream<string[]>,
		columns: Stream<FilterType>,
		householdID: NullUUID,
		loaded: boolean,
		picker: string,
		yearMonthPretty: string,
	} = {
		collapsedCategories: Stream([
			AuthAccountState.translate(WebGlobalHidden),
		]),
		columns: Stream<FilterType>({
			budgetCategoryName: "",
			amount: "", // eslint-disable-line sort-keys
			budgetCategoryTargetAmount: "",
			budgetTransactionAmount: "",
			balance: "", // eslint-disable-line sort-keys
		}),
		householdID: AuthAccountState.data().primaryAuthHouseholdID,
		loaded: false,
		picker: "",
		yearMonthPretty: "",
	};

	const categories = Stream.lift((month, collapsed, columns) => {
		m.redraw();

		return Filter.array(month.budgetMonthCategories.filter((category) => {
			return ! collapsed.includes(category.budgetCategory.grouping);
		}), columns, {});
	}, BudgetMonthState.data, state.collapsedCategories, state.columns);

	if (AppState.getSessionDisplay() === 1) {
		state.columns({
			budgetCategoryName: "",
			amount: "", // eslint-disable-line sort-keys
			budgetTransactionAmount: "",
			balance: "", // eslint-disable-line sort-keys
		});
	}

	if (AppState.getSessionDisplay() === 0) {
		state.columns({
			budgetCategoryName: "",
			amount: "", // eslint-disable-line sort-keys
			balance: "", // eslint-disable-line sort-keys
		});
	}

	return {
		oninit: async (): Promise<void> => {
			state.loaded = false;
			Telemetry.spanStart("BudgetCategories");

			AppState.setLayoutApp({
				...GetHelp("budget"),
				breadcrumbs: [
					{
						link: "/budget/accounts",
						name: AuthAccountState.translate(ObjectBudget),
					},
					{
						name: AuthAccountState.translate(ObjectCategories),
					},
				],
				toolbarActionButtons: [
					AppToolbarActions().newBudgetCategory,
				],
			});

			if (m.route.param().household === undefined) {
				m.route.param().household = state.householdID;
			} else {
				state.householdID = m.route.param().household;
			}

			if (parseInt(m.route.param().yearMonth, 10) >= 201801) {
				BudgetMonthState.yearMonth = YearMonth.fromNumber(parseInt(m.route.param().yearMonth, 10));
			} else {
				BudgetMonthState.yearMonth = CivilDate.now()
					.toYearMonth();
			}

			if (BudgetMonthState.data().yearMonth === CivilDate.now()
				.toYearMonth()
				.toNumber()) {
				await BudgetMonthState.load()
					.then(async (month: BudgetMonth) => {
						BudgetMonthState.data(month);
					});
			}

			return BudgetMonthState.read(state.householdID)
				.then(() => {
					Telemetry.spanEnd("BudgetCategories");
					state.loaded = true;
					m.redraw();
				});
		},
		view: (): m.Children => {
			return m(Table, {
				actions: [
					{
						icon: Icons.Budget,
						name: AuthAccountState.translate(WebGlobalActionBudgetTargetAmount),
						onclick: async (): Promise<void | Err> => {
							if (BudgetMonthState.data().budgetMonthCategories !== null) {
								BudgetMonthState.data().budgetMonthCategories.map(async (b) => { // eslint-disable-line @typescript-eslint/no-non-null-assertion
									if (b.budgetCategory.grouping === "" || b.budgetCategory.grouping === AuthAccountState.translate(WebGlobalHidden) || b.targetAmount === 0) {
										return;
									}

									b.amount = b.targetAmount as number;

									if (b.yearMonth === BudgetMonthState.yearMonth.toNumber()) {
										return BudgetMonthCategoryState.update(b);
									}

									b.yearMonth = BudgetMonthState.yearMonth.toNumber();
									return BudgetMonthCategoryState.create(b);
								});
							}

							return BudgetMonthState.read(state.householdID);
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
						requireOnline: true,
					},
				],

				data: categories(),
				editOnclick: (b: BudgetMonthCategory): void => {
					const budget = Clone(b);
					budget.id = b.budgetCategoryID; // needed to show formDelete
					budget.authHouseholdID = state.householdID;

					if (budget.id === null) {
						budget.id = UUID.new();
						budget.grouping = true;
					}

					AppState.setLayoutAppForm(FormOverlayBudgetCategory, budget as Data);
				},
				filters: [],
				getKey: (category: BudgetMonthCategory): string => {
					return `${category.budgetCategory.grouping}${category.budgetCategory.name}`;
				},
				loaded: state.loaded,
				noFilters: true,
				tableColumns: [
					{
						collapsedNames: state.collapsedCategories(),
						formatter: (category: BudgetMonthCategory): string => {
							return category.budgetCategory.name;
						},
						linkFormatter: (category: BudgetMonthCategory): string => {
							return `/budget/transactions?category=${category.budgetCategoryID}`;
						},
						linkRequireOnline: true,
						name: AuthAccountState.translate(ObjectCategory),
						onclick: (data): void => {
							const c = state.collapsedCategories();
							if (state.collapsedCategories()
								.includes(data)) {
								c.splice(c.indexOf(data), 1);
							} else {
								c.push(data);
							}

							state.collapsedCategories(c);
						},
						property: "budgetCategoryName",
						typeCheck: (category: BudgetMonthCategory): TableDataType => {
							if (category.budgetCategory.grouping === "") {
								return TableDataType.Collapsible;
							}
							return TableDataType.Link;
						},
					},
					{
						currencyFormat: AuthHouseholdState.findID(state.householdID).preferences.currency,
						formatter: (category: BudgetMonthCategory): number | string => {
							if (category.budgetCategory.income || category.budgetCategory.grouping === "" && category.budgetCategory.name === AuthAccountState.translate(WebGlobalHidden) || category.budgetCategory.grouping === AuthAccountState.translate(WebGlobalHidden)) {
								return "";
							}

							// The API returns the last known category in the category list.  So this amount will most likely be wrong for new months, so set it to zero if the yearMonth doesn't match
							return category.budgetCategory.name !== "Hidden" && (category.yearMonth === BudgetMonthState.yearMonth.toNumber() || category.budgetCategory.grouping === "") ?
								category.amount :
								0;
						},
						name: AuthAccountState.translate(WebGlobalBudgeted),
						property: "amount",
						type: TableDataType.Currency,
					},
					{
						currencyFormat: AuthHouseholdState.findID(state.householdID).preferences.currency,
						formatter: (category: BudgetMonthCategory): number | string => {
							if (category.targetAmount === 0) {
								return "";
							}

							return category.targetAmount as number;
						},
						name: AuthAccountState.translate(WebFormOverlayBudgetCategoryTargetAmount),
						positive: (category: BudgetMonthCategory): boolean => {
							return category.amount <= (category.targetAmount as number);
						},
						property: "budgetCategoryTargetAmount",
						type: TableDataType.Currency,
					},
					{
						currencyFormat: AuthHouseholdState.findID(state.householdID).preferences.currency,
						formatter: (category: BudgetMonthCategory): number | string => {
							if (category.budgetCategory.grouping === "") {
								if (category.budgetCategory.name === AuthAccountState.translate(WebGlobalHidden)) {
									return "";
								}

								return category.budgetTransactionAmount;
							}

							// The API returns the last known category in the category list.  So this amount will most likely be wrong for new months, so set it to zero if the yearMonth doesn't match
							return Currency.toString(category.yearMonth === BudgetMonthState.yearMonth.toNumber()
								? category.budgetTransactionAmount
								: 0, AuthHouseholdState.findID(state.householdID).preferences.currency);
						},
						linkFormatter: (category: BudgetMonthCategory): string => {
							return `/budget/transactions?category=${category.budgetCategoryID}&month=${BudgetMonthState.yearMonth.toNumber()}`;
						},
						linkRequireOnline: true,
						name: AuthAccountState.translate(ObjectChange),
						positive: (b: BudgetMonthCategory): boolean => {
							return b.budgetTransactionAmount === undefined ?
								true :
								b.budgetTransactionAmount >= 0;
						},
						property: "budgetTransactionAmount",
						rightAlign: true,
						typeCheck: (category: BudgetMonthCategory): TableDataType => {
							if (category.budgetCategory.grouping === "") {
								return TableDataType.Currency;
							}

							return TableDataType.Link;
						},
					},
					{
						currencyFormat: AuthHouseholdState.findID(state.householdID).preferences.currency,
						formatter: (category: BudgetMonthCategory): number | string => {
							if (category.budgetCategory.income || category.budgetCategory.grouping === "" && category.budgetCategory.name === AuthAccountState.translate(WebGlobalHidden)) {
								return "";
							}

							return category.balance;
						},
						name: AuthAccountState.translate(WebGlobalBudgetBalance),
						property: "balance",
						type: TableDataType.Currency,
					},
				],
				tableColumnsNameEnabled: state.columns,
				title: {
					buttonLeft: {
						href: `/budget/categories/${YearMonth.fromNumber(BudgetMonthState.yearMonth.toNumber())
							.addMonths(-1)
							.toNumber()}?household=${state.householdID}`,
						icon: Icons.Previous,
						name: YearMonth.fromNumber(BudgetMonthState.yearMonth.toNumber())
							.addMonths(-1)
							.toString(),
						permitted: true,
						requireOnline: true,
					},
					buttonRight: {
						href: `/budget/categories/${BudgetMonthState.yearMonth
							.addMonths(1)
							.toNumber()}?household=${state.householdID}`,
						icon: Icons.Next,
						iconRight: true,
						name: BudgetMonthState.yearMonth
							.addMonths(1)
							.toString(),
						permitted: true,
						requireOnline: true,
					},
					name: BudgetMonthState.yearMonth.toString(),
					subtitles: [
						{
							color: BudgetMonthState.data().budgetTransactionAmountIncomeRemaining + BudgetMonthState.data().budgetMonthCategoryAmount - BudgetMonthState.data().budgetTransactionAmountIncome < 0 ?
								"var(--color_negative)" :
								"var(--color_positive)",
							key: `${AuthAccountState.translate(WebBudgetCategoriesCarryover)}:`,
							value: BudgetMonthState.data().yearMonth === BudgetMonthState.yearMonth.toNumber() ?
								Currency.toString(BudgetMonthState.data().budgetTransactionAmountIncomeRemaining + BudgetMonthState.data().budgetMonthCategoryAmount - BudgetMonthState.data().budgetTransactionAmountIncome, AuthHouseholdState.findID(state.householdID).preferences.currency) :
								Currency.toString(BudgetMonthState.data().budgetTransactionAmountIncomeRemaining, AuthHouseholdState.findID(state.householdID).preferences.currency),
						},
						{
							color: BudgetMonthState.data().yearMonth === BudgetMonthState.yearMonth.toNumber() && BudgetMonthState.data().budgetTransactionAmountIncome < 0 ?
								"var(--color_negative)" :
								"var(--color_positive)",
							key: `${AuthAccountState.translate(ObjectBudgetCategoryGroupingIncome)}:`,
							value: BudgetMonthState.data().yearMonth === BudgetMonthState.yearMonth.toNumber() ?
								Currency.toString(BudgetMonthState.data().budgetTransactionAmountIncome, AuthHouseholdState.findID(state.householdID).preferences.currency) :
								Currency.toString(0, AuthHouseholdState.findID(state.householdID).preferences.currency),
						},
						{
							color: -1 * BudgetMonthState.data().budgetMonthCategoryAmount < 0 ?
								"var(--color_negative)" :
								"var(--color_positive)",
							key: `${AuthAccountState.translate(WebGlobalBudgeted)}:`,
							value: BudgetMonthState.data().yearMonth === BudgetMonthState.yearMonth.toNumber() ?
								Currency.toString(BudgetMonthState.data().budgetMonthCategoryAmount * -1, AuthHouseholdState.findID(state.householdID).preferences.currency) :
								Currency.toString(0, AuthHouseholdState.findID(state.householdID).preferences.currency),
						},
						{
							color: "var(--color_negative)",
							key: `${AuthAccountState.translate(WebFormOverlayBudgetCategoryTargetAmount)}:`,
							value: BudgetMonthState.data().yearMonth === BudgetMonthState.yearMonth.toNumber() ?
								Currency.toString(-1 * (BudgetMonthState.data().targetAmount as number), AuthHouseholdState.findID(state.householdID).preferences.currency) :
								Currency.toString(0, AuthHouseholdState.findID(state.householdID).preferences.currency),
						},
						{
							color: BudgetMonthState.data().budgetTransactionAmountIncomeRemaining < 0 ?
								"var(--color_negative)" :
								"var(--color_positive)",
							key: `${AuthAccountState.translate(WebBudgetCategoriesRemaining)}:`,
							value: Currency.toString(BudgetMonthState.data().budgetTransactionAmountIncomeRemaining, AuthHouseholdState.findID(state.householdID).preferences.currency),
						},
					],
					tabs: TitleTabsAuthHousehold(),
				},
			});
		},
	};
}
