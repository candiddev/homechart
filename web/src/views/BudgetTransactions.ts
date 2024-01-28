import "./BudgetTransactions.css";

import { Button } from "@lib/components/Button";
import { FormImportCSV } from "@lib/components/FormImportCSV";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { UUID } from "@lib/types/UUID";
import type { YearMonth } from "@lib/types/YearMonth";
import { Clone } from "@lib/utilities/Clone";
import { ActionAdd, FormImageSelect } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBudgetTransaction } from "../components/FormOverlayBudgetTransaction";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { BudgetAccount } from "../states/BudgetAccount";
import { BudgetAccountState } from "../states/BudgetAccount";
import type { BudgetCategory } from "../states/BudgetCategory";
import { BudgetCategoryState } from "../states/BudgetCategory";
import type { BudgetPayee } from "../states/BudgetPayee";
import { BudgetPayeeState } from "../states/BudgetPayee";
import type { BudgetRecurrence } from "../states/BudgetRecurrence";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import type { BudgetTransaction } from "../states/BudgetTransaction";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import type { BudgetTransactionFields } from "../utilities/CSVToBudgetTransactions";
import { CSVToBudgetTransactions } from "../utilities/CSVToBudgetTransactions";
import { GetHelp } from "../utilities/GetHelp";
import { OFXToBudgetTransactions } from "../utilities/OFXToBudgetTransactions";
import { ObjectAccounts, ObjectBudget, ObjectCategories, ObjectCategory, ObjectNote, ObjectPayee, ObjectPayees, ObjectRecurringTransactions, ObjectTaskNextDate, ObjectTransaction, ObjectTransactions, WebBudgetChartsTotal, WebBudgetTransactionsTransferFrom, WebBudgetTransactionsTransferTo, WebGlobalActionImportTransactions, WebGlobalActionNext, WebGlobalActionPrevious, WebGlobalActionReconcile, WebGlobalActionSkip, WebGlobalAllTransactions, WebGlobalBudgetAmount, WebGlobalBudgetBalance, WebGlobalDate, WebGlobalMultiple, WebGlobalOf, WebGlobalTransactionStatusCleared, WebGlobalTransactionStatusReconciled } from "../yaml8n";

function updateYearMonthRecurrence (budgetRecurrence: BudgetRecurrence): void {
	if (budgetRecurrence.template.date !== null) {
		const dateYM = CivilDate.fromString(budgetRecurrence.template.date)
			.toYearMonth();
		const nextYM = Recurrence.nextTimestamp(budgetRecurrence.recurrence, Timestamp.fromCivilDate(CivilDate.fromString(budgetRecurrence.template.date)))
			.toCivilDate()
			.toYearMonth();
		if (dateYM !== nextYM && budgetRecurrence.template.categories !== null) {
			for (let i = 0; i < budgetRecurrence.template.categories.length; i++) {
				budgetRecurrence.template.categories[i].yearMonth = nextYM.toNumber();
			}
		}
	}
}

function nextDueDate (): m.Component<BudgetRecurrence> {
	return {
		view: (vnode): m.Children => {
			return m("div.TableData__buttons", [
				m("span", AppState.formatCivilDate(vnode.attrs.template.date)),
				m("div", [
					m(Button, {
						id: `add-${vnode.attrs.id}`,
						name: AuthAccountState.translate(ActionAdd),
						onclick: async (): Promise<void | Err> => {
							const data = Clone(vnode.attrs);

							return BudgetTransactionState.create(data.template)
								.then(async () => {
									if (data.template.date !== null) {
										data.template.date = Recurrence.nextCivilDate(data.recurrence, CivilDate.fromString(data.template.date))
											.toJSON();
									}

									updateYearMonthRecurrence(data);
									return BudgetRecurrenceState.update(data, true);
								})
								.then(async () => {
									return BudgetTransactionState.read(true);
								});
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
						primary: true,
						requireOnline: true,
					}),
					m(Button, {
						accent: true,
						id: `skip-${vnode.attrs.id}`,
						name: AuthAccountState.translate(WebGlobalActionSkip),
						onclick: async (): Promise<void | Err> => {
							const data = Clone(vnode.attrs);

							data.template.date = Recurrence.nextCivilDate(data.recurrence, CivilDate.fromString(`${data.template.date}`))
								.toJSON();

							updateYearMonthRecurrence(data);
							return BudgetRecurrenceState.update(data)
								.then(async () => {
									return BudgetTransactionState.read(true);
								});
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
						requireOnline: true,
					}),
				]),
			]);
		},
	};
}

export function BudgetTransactions (): m.Component {
	const state: {
		addRecurrence: BudgetRecurrence,
		budgetAccount: Stream<BudgetAccount>,
		budgetCategory: BudgetCategory,
		budgetCategoryMonth: number,
		budgetPayee: BudgetPayee,
		cleared: BudgetTransaction,
		columns: Stream<FilterType>,
		formImportFields: BudgetTransactionFields,
		formImportVisible: boolean,
		formRecurrence: {
			data: BudgetRecurrence,
			visible: boolean,
		},
		formTransaction: {
			data: BudgetTransaction,
			visible: boolean,
		},
		formTransactionRecurring: boolean,
		importID: Stream<NullUUID>,
		page: number,
		recurrenceCount: number,
		recurring: boolean,
		yearMonth: YearMonth,
	} = {
		addRecurrence:BudgetRecurrenceState.new(),
		budgetAccount: Stream(BudgetAccountState.new()),
		budgetCategory: BudgetCategoryState.new(),
		budgetCategoryMonth: 0,
		budgetPayee: BudgetPayeeState.new(),
		cleared: BudgetTransactionState.new(),
		columns: Stream<FilterType>({}),
		formImportFields: {
			Amount: "",
			Date: "",
			Payee: "",
		},
		formImportVisible: false,
		formRecurrence: {
			data: BudgetRecurrenceState.new(),
			visible: false,
		},
		formTransaction: {
			data: BudgetTransactionState.new(),
			visible: false,
		},
		formTransactionRecurring: false,
		importID: Stream(null as NullUUID),
		page: 1,
		recurrenceCount: 0,
		recurring: false,
		yearMonth: Timestamp.now()
			.toCivilDate()
			.toYearMonth(),
	};

	const recurrences = Stream.lift((recurrences, account) => {
		m.redraw();

		return BudgetRecurrenceState.findBudgetAccountID(recurrences, account.id);
	}, BudgetRecurrenceState.data, state.budgetAccount);

	function getAmount (b: BudgetTransaction): number {
		if (state.budgetAccount().id !== null) {
			if (b.accounts !== null) {
				for (const account of b.accounts) {
					if (account.budgetAccountID === state.budgetAccount().id) {
						return account.amount;
					}
				}
			}
		}
		if (state.budgetCategory.id !== null) {
			if (b.categories !== null) {
				for (const category of b.categories) {
					if (category.budgetCategoryID === state.budgetCategory.id) {
						return category.amount;
					}
				}
			}
		}
		return b.amount;
	}

	function getHref (): string {
		const base = "/budget/transactions?";
		if (state.budgetAccount().id !== null) {
			return `${base}account=${state.budgetAccount().id}`;
		}
		if (state.budgetCategory.id !== null) {
			let c = `${base}category=${state.budgetCategory.id}`;
			if (state.budgetCategoryMonth !== null) {
				c += `&month=${state.budgetCategoryMonth}`;
			}
			return c;
		}
		if (state.budgetPayee.id !== null) {
			return `${base}payee=${state.budgetPayee.id}`;
		}
		return "";
	}

	function getName (): string {
		if (state.budgetAccount().id !== null) {
			return BudgetAccountState.findID(state.budgetAccount().id).name;
		}
		if (state.budgetCategory.id !== null) {
			return BudgetCategoryState.findID(state.budgetCategory.id).name;
		}
		if (state.budgetPayee.id !== null) {
			return BudgetPayeeState.findID(state.budgetPayee.id).name;
		}
		return "";
	}

	function getParent (): string {
		if (state.budgetAccount().id !== null) {
			return AuthAccountState.translate(ObjectAccounts);
		}
		if (state.budgetCategory.id !== null) {
			return AuthAccountState.translate(ObjectCategories);
		}
		if (state.budgetPayee.id !== null) {
			return AuthAccountState.translate(ObjectPayees);
		}
		return "";
	}

	function getTitle (): string | undefined {
		if (BudgetTransactionState.data.length === 0 || BudgetTransactionState.data.length === BudgetTransactionState.total) {
			return undefined;
		}

		return `${state.page === 1 ?
			"1" :
			50 * (state.page - 1) + 1} - ${50 * (state.page - 1) + BudgetTransactionState.data().length} ${AuthAccountState.translate(WebGlobalOf)} ${BudgetTransactionState.total} ${AuthAccountState.translate(ObjectTransactions)}`;
	}

	function generateDefaults (): BudgetTransaction {
		const transaction = BudgetTransactionState.new();
		transaction.date = BudgetTransactionState.lastDate;
		if (state.budgetAccount().id !== null) {
			transaction.accounts = [
				{
					...BudgetTransactionState.newAccount(),
					...{
						budgetAccountID: state.budgetAccount().id,
						id: UUID.new(),
					},
				},
			];
		}
		if (state.budgetCategory.id !== null) {
			transaction.categories = [
				{
					...BudgetTransactionState.newCategory(),
					...{
						budgetCategoryID: state.budgetCategory.id,
						id: UUID.new(),
					},
				},
			];
			if (state.budgetCategoryMonth !== null && transaction.date !== null) {
				transaction.categories[0].yearMonth = CivilDate.fromString(transaction.date)
					.toYearMonth()
					.toNumber();
			}
		}
		if (state.budgetPayee.id !== null) {
			transaction.budgetPayeeID = state.budgetPayee.id;
		}

		return transaction;
	}

	const setColumns = (): void => {
		state.columns({
			date: "",
			nextDate: "",
			payee: "", // eslint-disable-line sort-keys
			category: "", // eslint-disable-line sort-keys
			note: "",
			amount: "", // eslint-disable-line sort-keys
			balance: "",
		});

		if (m.route.param().account !== undefined) {
			state.columns({
				date: "",
				nextDate: "",
				payee: "", // eslint-disable-line sort-keys
				category: "", // eslint-disable-line sort-keys
				note: "",
				cleared: "", // eslint-disable-line sort-keys
				reconciled: "",
				amount: "", // eslint-disable-line sort-keys
				balance: "",
			});
			m.redraw();
		}

		if (AppState.getSessionDisplay() <= DisplayEnum.Medium) {
			state.columns({
				date: "",
				nextDate: "",
				payee: "", // eslint-disable-line sort-keys
				amount: "", // eslint-disable-line sort-keys
				balance: "",
			});
		}
	};

	let s: Stream<Promise<void | Err>>;

	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("BudgetTransactions");

			setColumns();

			if (m.route.param().page !== undefined) {
				state.page = parseInt(m.route.param().page, 10);
				BudgetTransactionState.offset = 0;
				if (state.page !== 1) {
					BudgetTransactionState.offset = (state.page - 1) * 50;
				}
			}

			if (m.route.param().recurring !== undefined) {
				state.recurring = true;
			}

			if (m.route.param().month !== undefined) {
				state.budgetCategoryMonth = m.route.param().month;
			}

			if (m.route.param().import === undefined) {
				BudgetTransactionState.data([]);
				m.redraw();
			} else {
				state.importID(m.route.param().import);
			}

			s = Stream.lift(async (_budgetAccounts, _budgetCategories, _budgetPayees, importID) => {
				if (m.route.param().account !== undefined) {
					state.budgetAccount(BudgetAccountState.findID(m.route.param().account));
					state.recurrenceCount = BudgetRecurrenceState.findBudgetAccountIDToday(state.budgetAccount().id);
				}

				if (m.route.param().category !== undefined) {
					state.budgetCategory = BudgetCategoryState.findID(m.route.param().category);
				}

				if (m.route.param().payee !== undefined) {
					state.budgetPayee = BudgetPayeeState.findID(m.route.param().payee);
				}

				if (importID !== null) {
					state.columns({
						date: "",
						payee: "", // eslint-disable-line sort-keys
						category: "", // eslint-disable-line sort-keys
						amount: "", // eslint-disable-line sort-keys
					});
					state.budgetAccount(BudgetAccountState.findID(importID));

					m.redraw();
				}

				AppState.setLayoutApp({
					...GetHelp("budget"),
					breadcrumbs: [
						{
							link: "/budget/accounts",
							name: AuthAccountState.translate(ObjectBudget),
						},
						{
							link: `/budget/${getParent()
								.toLowerCase()}`,
							name: `${getParent()}`,
						},
						{
							name: getName(),
						},
					],
					toolbarActionButtons: [
						{
							icon: Icons.BudgetTransaction,
							name: AuthAccountState.translate(ObjectTransaction),
							onclick: state.importID() !== null ? // eslint-disable-line no-negated-condition
								async (): Promise<void | Err> => {

									const payees: string[] = [];
									const transactions: BudgetTransaction[] = [];

									for (const transaction of BudgetTransactionState.data()) {
										if (transaction.budgetPayeeName !== "") {
											if (payees.includes(transaction.budgetPayeeName)) {
												transaction.budgetPayeeID = BudgetPayeeState.findName(transaction.budgetPayeeName).id;
												transaction.budgetPayeeName = "";
											} else {
												payees.push(transaction.budgetPayeeName);
											}
										}
										await BudgetTransactionState.create(transaction)
											.catch(() => {
												transactions.push(transaction);
											});
									}

									if (transactions.length > 0) {
										BudgetTransactionState.data(transactions);
										m.redraw();
										return;
									}

									m.route.set(`/budget/transactions?account=${state.budgetAccount().id}`);
									state.importID(null);
									setColumns();
									return BudgetTransactionState.read(true);
								} :
								(): void => {
									AppState.setLayoutAppForm(FormOverlayBudgetTransaction, {
										...BudgetRecurrenceState.new(),
										...{
											template: generateDefaults(),
										},
									});
								},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
							requireOnline: true,
						},
					],
				});

				if (BudgetTransactionState.data().length === 0) {
					return BudgetTransactionState.read();
				}

				m.redraw();

				return;
			}, BudgetAccountState.data, BudgetCategoryState.data, BudgetPayeeState.data, state.importID);


			Telemetry.spanEnd("BudgetTransactions");
		},
		onremove: (): void => {
			s.end(true);
		},
		view: (): m.Children => {
			return [
				m(FormImportCSV, {
					buttons: [
						{
							name: `${AuthAccountState.translate(FormImageSelect)} OFX/QFX`,
							oninput: async (file): Promise<void> => {
								const reader = new FileReader();
								reader.onload = async (): Promise<void> => {
									if (typeof reader.result === "string") {
										state.formImportVisible = false;
										BudgetTransactionState.data(await OFXToBudgetTransactions(reader.result, state.budgetAccount().id));
										m.route.set(`/budget/transactions?import=${state.budgetAccount().shortID}`, {}, {
											state: {
												key: Date.now(),
											},
										});
									}
								};
								reader.readAsText(file);
							},
							permitted: true,
							primary: true,
							requireOnline: true,
						},
					],
					fields: state.formImportFields,
					oninput: (field: string, value: string): void => {
						state.formImportFields[field] = value;
					},
					onsubmit: async (csvData): Promise<void> => {
						BudgetTransactionState.data(await CSVToBudgetTransactions(csvData, state.budgetAccount().id, state.formImportFields));
						m.route.set(`/budget/transactions?import=${state.budgetAccount().shortID}`, {}, {
							state: {
								key: Date.now(),
							},
						});
					},
					title: AuthAccountState.translate(WebGlobalActionImportTransactions),
					toggle: (visible) => {
						state.formImportVisible = visible;
					},
					visible: state.formImportVisible,
				}),
				m(Table, {
					actions: [
						{
							icon: Icons.ImportExport,
							name: AuthAccountState.translate(WebGlobalActionImportTransactions),
							onclick: async (): Promise<void | Err> => {
								if (state.importID() === null) {
									state.formImportVisible = true;
									return;
								}

								const transactions: BudgetTransaction[] = [];
								for (const transaction of BudgetTransactionState.data()) {
									await BudgetTransactionState.create(transaction)
										.catch(() => {
											transactions.push(transaction);
										});
								}

								if (transactions.length > 0) {
									BudgetTransactionState.data(transactions);
									m.redraw();
									return;
								}
								m.route.set(`/budget/transactions?account=${state.budgetAccount().id}`);
								state.importID(null);
								setColumns();
								return BudgetTransactionState.read();
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
							requireOnline: true,
						},
						{
							icon: Icons.Clear,
							name: AuthAccountState.translate(WebGlobalActionReconcile),
							onclick: async (): Promise<void | Err> => {
								return BudgetAccountState.reconcile(state.budgetAccount().id)
									.then(async () => {
										return BudgetTransactionState.read(true);
									});
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && state.budgetAccount().id !== null && BudgetAccountState.findID(state.budgetAccount().id).budgetTransactionAmountCleared !== BudgetAccountState.findID(state.budgetAccount().id).budgetTransactionAmountReconciled && state.importID() === null,
							requireOnline: true,
						},
					],
					data: state.recurring ?
						recurrences() :
						BudgetTransactionState.data(),
					editOnclick: (form: BudgetTransaction | BudgetRecurrence): void => {
						if ((form as BudgetRecurrence).template === undefined) {
							AppState.setLayoutAppForm(FormOverlayBudgetTransaction, {
								...BudgetRecurrenceState.new(),
								...{
									authHouseholdID: form.authHouseholdID,
									id: form.id,
									template: form,
								},
							});
						} else {
							AppState.setLayoutAppForm(FormOverlayBudgetTransaction, form);
						}
					},
					filters: [],
					id: "transactions",
					loaded: m.route.param().recurring !== undefined && BudgetRecurrenceState.isLoaded() || BudgetTransactionState.loaded,
					noFilters: true,
					tableColumns: state.recurring ?
						[
							{
								name: AuthAccountState.translate(ObjectTaskNextDate),
								property: "nextDate",
								render: nextDueDate,
								type: TableDataType.Date,
							},
							{
								formatter: (b: BudgetRecurrence): string => {
									if (b.template.budgetPayeeID !== null) {
										return BudgetPayeeState.findID(b.template.budgetPayeeID).name;
									} else if (b.template.accounts !== null && b.template.accounts.length === 2) {
										for (const account of b.template.accounts) {
											if (account.budgetAccountID !== state.budgetAccount().id) {
												return `${account.amount > 0 ?
													AuthAccountState.translate(WebBudgetTransactionsTransferTo):
													AuthAccountState.translate(WebBudgetTransactionsTransferFrom)} ${BudgetAccountState.findID(account.budgetAccountID).name}`;
											}
										}
									}

									return AuthAccountState.translate(WebGlobalMultiple);
								},
								name: AuthAccountState.translate(ObjectPayee),
								property: "payee",
								type: TableDataType.Text,
							},
							{
								formatter: (b: BudgetRecurrence): string => {
									if (b.template.categories !== null) {
										if (b.template.categories.length === 1) {
											return BudgetCategoryState.findIDHeaderName(b.template.categories[0].budgetCategoryID);
										}
										return AuthAccountState.translate(WebGlobalMultiple);
									}
									return "";
								},
								name: AuthAccountState.translate(ObjectCategory),
								property: "category",
								typeCheck: (b: BudgetRecurrence): TableDataType => {
									if (b.template.categories!== null && b.template.categories.length > 1) {
										return TableDataType.Bold;
									}
									return TableDataType.Text;
								},
							},
							{
								currencyFormat: AuthHouseholdState.findID(state.budgetAccount().id === null ?
									state.budgetCategory.id === null ?
										state.budgetPayee.authHouseholdID :
										state.budgetCategory.authHouseholdID :
									state.budgetAccount().authHouseholdID).preferences.currency,
								formatter: (b: BudgetRecurrence): number => {
									return getAmount(b.template);
								},
								name: AuthAccountState.translate(WebGlobalBudgetAmount),
								property: "amount",
								type: TableDataType.Currency,
							},
						] :
						[
							{
								name: AuthAccountState.translate(WebGlobalDate),
								property: "date",
								type: TableDataType.Date,
							},
							{
								formatter: (b: BudgetTransaction): string => {
									if (b.budgetPayeeName !== "") {
										return b.budgetPayeeName;
									} else if (b.budgetPayeeID !== null) {
										return BudgetPayeeState.findID(b.budgetPayeeID).name;
									} else if (b.accounts !== null) {
										if (b.accounts.length === 2) {
											for (const account of b.accounts) {
												if (account.budgetAccountID !== state.budgetAccount().id) {
													return `${account.amount > 0 ?
														AuthAccountState.translate(WebBudgetTransactionsTransferTo) :
														AuthAccountState.translate(WebBudgetTransactionsTransferFrom)} ${BudgetAccountState.findID(account.budgetAccountID).name}`;
												}
											}
										} else if (b.accounts.length === 1) {
											return "";
										}
									}

									return AuthAccountState.translate(WebGlobalMultiple);
								},
								name: AuthAccountState.translate(ObjectPayee),
								property: "payee",
								type: TableDataType.Text,
							},
							{
								formatter: (b: BudgetTransaction): string => {
									if (b.categories === null || b.categories.length === 0) {
										return "";
									}
									if (b.categories.length === 1) {
										return BudgetCategoryState.findIDHeaderName(b.categories[0].budgetCategoryID);
									}
									return AuthAccountState.translate(WebGlobalMultiple);
								},
								name: AuthAccountState.translate(ObjectCategory),
								property: "category",
								typeCheck: (b: BudgetTransaction): TableDataType => {
									if (b.categories !== null && b.categories.length > 1) {
										return TableDataType.Bold;
									}
									return TableDataType.Text;
								},
							},
							{
								name: AuthAccountState.translate(ObjectNote),
								property: "note",
							},
							{
								currencyFormat: AuthHouseholdState.findID(state.budgetAccount().id === null ?
									state.budgetCategory.id === null ?
										state.budgetPayee.authHouseholdID :
										state.budgetCategory.authHouseholdID :
									state.budgetAccount().authHouseholdID).preferences.currency,
								formatter: (b: BudgetTransaction): number => {
									return getAmount(b);
								},
								name: AuthAccountState.translate(WebGlobalBudgetAmount),
								property: "amount",
								type: TableDataType.Currency,
							},
							{
								currencyFormat: AuthHouseholdState.findID(state.budgetAccount().id === null ?
									state.budgetCategory.id === null ?
										state.budgetPayee.authHouseholdID :
										state.budgetCategory.authHouseholdID :
									state.budgetAccount().authHouseholdID).preferences.currency,
								name: AuthAccountState.translate(WebGlobalBudgetBalance),
								property: "balance",
								type: TableDataType.Currency,
							},
							{
								checkboxOnclick: async (data: BudgetTransaction): Promise<void> => {
									state.cleared = data;
									if (state.cleared.accounts !== null) {
										let updated = false;

										for (const account of state.cleared.accounts) {
											if (account.budgetAccountID === state.budgetAccount().id) {
												if (account.status === 2) {
													return;
												}
												if (account.status >= 1) {
													account.status = 0;
												} else {
													account.status = 1;
												}
												await BudgetTransactionState.update(state.cleared)
													.then(async () => {
														updated = true;
													});
											}
										}

										if (updated) {
											await BudgetTransactionState.read(true);
										}
									}
								},
								formatter: (b: BudgetTransaction): boolean => {
									if (b.accounts !== null) {
										for (const account of b.accounts) {
											if (account.budgetAccountID === state.budgetAccount().id) {
												return account.status >= 1;
											}
										}
									}
									return false;
								},
								name: AuthAccountState.translate(WebGlobalTransactionStatusCleared),
								permitted: (): boolean => {
									return GlobalState.permitted(PermissionComponentsEnum.Budget, true);
								},
								property: "cleared",
								type: TableDataType.Checkbox,
							},
							{
								checkboxOnclick: async (data: BudgetTransaction): Promise<void | Err> => {
									state.cleared = data;
									if (state.cleared .accounts !== null)  {
										for (const account of state.cleared.accounts) {
											if (account.budgetAccountID === state.budgetAccount().id) {
												if (account.status === 2) {
													return;
												}
												account.status = 2;
												return BudgetTransactionState.update(state.cleared)
													.then(async () => {
														return BudgetTransactionState.read(true);
													});
											}
										}
									}
								},
								formatter: (b: BudgetTransaction): boolean => {
									if (b.accounts !== null) {
										for (const account of b.accounts) {
											if (account.budgetAccountID === state.budgetAccount().id) {
												return account.status === 2;
											}
										}
									}
									return false;
								},
								name: AuthAccountState.translate(WebGlobalTransactionStatusReconciled),
								permitted: (): boolean => {
									return GlobalState.permitted(PermissionComponentsEnum.Budget, true);
								},
								property: "reconciled",
								type: TableDataType.Checkbox,
							},
						],
					tableColumnsNameEnabled: state.columns,
					title: {
						buttonLeft: state.page === 1 || state.recurring ?
							undefined :
							{
								href: `${getHref()}&page=${state.page - 1}`,
								icon: Icons.Previous,
								name: AuthAccountState.translate(WebGlobalActionPrevious),
								permitted: true,
								requireOnline: true,
							},
						buttonRight: state.page * 50 > BudgetTransactionState.total || state.recurring ?
							undefined :
							{
								href: `${getHref()}&page=${state.page + 1}`,
								icon: Icons.Next,
								name: AuthAccountState.translate(WebGlobalActionNext),
								permitted: true,
								requireOnline: true,
							},
						loaded: m.route.param().recurring !== undefined && BudgetRecurrenceState.isLoaded() || BudgetTransactionState.loaded,
						name: state.importID() !== null ? // eslint-disable-line no-negated-condition
							undefined :
							state.recurring ?
								undefined :
								getTitle(),
						subtitles: state.importID() !== null || state.recurring || state.budgetAccount().id === null ?
							undefined :
							[
								{
									color: BudgetAccountState.findID(state.budgetAccount().id).budgetTransactionAmount < 0 ?
										"var(--color_negative)" :
										"var(--color_positive)",
									key: `${AuthAccountState.translate(WebBudgetChartsTotal)}:`,
									value: Currency.toString(state.budgetAccount().budgetTransactionAmount, AuthHouseholdState.findID(state.budgetAccount().authHouseholdID).preferences.currency),
								},
								{
									color: BudgetAccountState.findID(state.budgetAccount().id).budgetTransactionAmountCleared < 0 ?
										"var(--color_negative)" :
										"var(--color_positive)",
									key: `${AuthAccountState.translate(WebGlobalTransactionStatusCleared)}:`,
									value: Currency.toString(state.budgetAccount().budgetTransactionAmountCleared, AuthHouseholdState.findID(state.budgetAccount().authHouseholdID).preferences.currency),
								},
								{
									color: BudgetAccountState.findID(state.budgetAccount().id).budgetTransactionAmountReconciled < 0 ?
										"var(--color_negative)" :
										"var(--color_positive)",
									key: `${AuthAccountState.translate(WebGlobalTransactionStatusReconciled)}:`,
									value: Currency.toString(state.budgetAccount().budgetTransactionAmountReconciled, AuthHouseholdState.findID(state.budgetAccount().authHouseholdID).preferences.currency),
								},
							],
						tabs: state.budgetAccount().id === null || state.importID() !== null ?
							undefined :
							[
								{
									active: ! state.recurring,
									href: m.parsePathname(m.route.get()).path,
									name: AuthAccountState.translate(WebGlobalAllTransactions),
								},
								{
									active: state.recurring,
									count: state.recurrenceCount,
									href: `${m.route.get()}${m.route.get()
										.includes("?") ?
										"&" :
										"?"}recurring`,
									name: AuthAccountState.translate(ObjectRecurringTransactions),
								},
							],
					},
				}),
			];
		},
	};
}
