import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputCurrency } from "@lib/components/FormItemInputCurrency";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import { FormRecurrence } from "@lib/components/FormRecurrence";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import type { FilterType } from "@lib/types/Filter";
import { Recurrence } from "@lib/types/Recurrence";
import { UUID } from "@lib/types/UUID";
import { YearMonth } from "@lib/types/YearMonth";
import { Animate, Animation } from "@lib/utilities/Animate";
import { Clone } from "@lib/utilities/Clone";
import { ActionAdd, ActionCancel, ActionDelete, ActionNew, ActionUpdate } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import type { BudgetRecurrence } from "../states/BudgetRecurrence";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import type { BudgetTransaction, BudgetTransactionAccount, BudgetTransactionCategory } from "../states/BudgetTransaction";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { GlobalState } from "../states/Global";
import { BudgetTransactionAccountStatusEnum } from "../types/BudgetTransactionAccountStatus";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectAccount, ObjectAccounts, ObjectCategories, ObjectCategory, ObjectNote, ObjectPayee, ObjectTransaction, WebBudgetCategoriesRemaining, WebBudgetTransactionsTransferTo, WebFormOverlayBudgetTransactionAmountTooltip, WebFormOverlayBudgetTransactionCategoryTooltip, WebFormOverlayBudgetTransactionDateTooltip, WebFormOverlayBudgetTransactionDontRoll, WebFormOverlayBudgetTransactionMonthTooltip, WebFormOverlayBudgetTransactionNoteTooltip, WebFormOverlayBudgetTransactionPayeeTooltip, WebGlobalBudgetAmount, WebGlobalBudgetMonth, WebGlobalDate, WebGlobalName, WebGlobalNameTooltip, WebGlobalRecurring, WebGlobalStatus, WebGlobalTransactionStatusCleared, WebGlobalTransactionStatusReconciled, WebGlobalTransactionStatusUncleared } from "../yaml8n";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";

interface ItemsWithAmounts {
	amount: number,
}

export function FormOverlayBudgetTransaction (): m.Component<FormOverlayComponentAttrs<BudgetRecurrence>> {
	const addAmounts = (items: ItemsWithAmounts[] | null): number => {
		let amount = 0;

		if (items !== null) {
			for (const item of items) {
				amount += item.amount;
			}
		}

		return amount;
	};

	const state = {
		accounts: Stream<BudgetTransactionAccount[]>([]),
		categories: Stream<BudgetTransactionCategory[]>([]),
		columnsAccounts: Stream<FilterType>({
			budgetAccountID: "",
			amount: "", // eslint-disable-line sort-keys
			status: "",
		}),
		columnsCategories: Stream<FilterType>({
			budgetCategoryID: "",
			amount: "", // eslint-disable-line sort-keys
			yearMonth: "",
		}),
		formAccount: {
			data: BudgetTransactionState.newAccount(),
			visible: false,
		},
		formCategory: {
			data: BudgetTransactionState.newCategory(),
			visible: false,
		},
	};

	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		oninit: (vnode): void => {
			if (vnode.attrs.data.template.accounts !== null) {
				state.accounts(Clone(vnode.attrs.data.template.accounts));
			}
			if (vnode.attrs.data.template.categories !== null) {
				state.categories(Clone(vnode.attrs.data.template.categories));
			}
		},
		onupdate: (vnode): void => {
			if (vnode.attrs.data.template.accounts !== null && JSON.stringify(vnode.attrs.data.template.accounts) !== JSON.stringify(state.accounts())) {
				state.accounts(Clone(vnode.attrs.data.template.accounts));
				m.redraw();
			}

			if (vnode.attrs.data.template.categories !== null && JSON.stringify(vnode.attrs.data.template.categories) !== JSON.stringify(state.categories())) {
				state.categories(Clone(vnode.attrs.data.template.categories));
				m.redraw();
			}
		},
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectTransaction),
				onDelete: async (): Promise<void | Err> => {
					// If we're importing, splice it
					if (m.route.param().import !== undefined) {
						const i = BudgetTransactionState.data()
							.findIndex((transaction: BudgetTransaction) => {
								return transaction.id === vnode.attrs.data.id;
							});
						BudgetTransactionState.data()
							.splice(i, 1);
						return;
					// If it's a BudgetRecurrence, delete it
					} else if (vnode.attrs.data.recurrence.separation !== 0) {
						return BudgetRecurrenceState.delete(vnode.attrs.data.id);
					}

					// Else delete the ID
					return BudgetTransactionState.delete(vnode.attrs.data.id)
						.then(async () => {
							return BudgetTransactionState.read(true);
						});
				},
				onSubmit: async (): Promise<BudgetRecurrence | void | Err> => {
					// If we're importing, replace or do nothing
					if (m.route.param().import !== undefined) {
						if (vnode.attrs.data.id !== null) {
							const transactions = BudgetTransactionState.data();

							const i = transactions
								.findIndex((transaction: BudgetTransaction) => {
									return transaction.id === vnode.attrs.data.id;
								});

							transactions[i] = vnode.attrs.data.template;
							BudgetTransactionState.data(transactions);
							m.redraw();
							return;
						}

						return;
					}

					// Copy AuthHouseholdID to template
					vnode.attrs.data.template.authHouseholdID = vnode.attrs.data.authHouseholdID;

					// If this is a recurrence, move it to the next day and update categories
					if (vnode.attrs.data.template.date !== null && vnode.attrs.data.recurrence.separation !== 0) {
						BudgetRecurrenceState.updateCategoryYearMonthRecurrence(vnode.attrs.data);
					}

					// If this is an existing recurrence, update it
					if (vnode.attrs.data.id !== null && vnode.attrs.data.budgetAccountID !== null) {
						return BudgetRecurrenceState.update(vnode.attrs.data);
					// If this is an existing Transaction, update it
					} else if (vnode.attrs.data.template.id !== null) {
						return BudgetTransactionState.update(vnode.attrs.data.template)
							.then(async () => {
								return BudgetTransactionState.read(true);
							});
					}

					return BudgetTransactionState.create(vnode.attrs.data.template)
						.then(async (): Promise<void | Err> => {
							// If the transaction was marked as recurring now, create a recurrence for it.
							if (vnode.attrs.data.recurrence.separation !== 0 && vnode.attrs.data.template.date !== null) {
								// Set BudgetPayeeID if possible
								if (vnode.attrs.data.template.budgetPayeeName !== undefined && vnode.attrs.data.template.budgetPayeeName !== "") {
									vnode.attrs.data.template.budgetPayeeID = BudgetPayeeState.findName(vnode.attrs.data.template.budgetPayeeName).id;
									vnode.attrs.data.template.budgetPayeeName = "";
								}

								if (vnode.attrs.data.budgetAccountID === null && vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 0) {
									vnode.attrs.data.budgetAccountID = vnode.attrs.data.template.accounts[0].budgetAccountID;
								}

								vnode.attrs.data.template.date = Recurrence.nextCivilDate(vnode.attrs.data.recurrence, CivilDate.fromString(vnode.attrs.data.template.date))
									.toJSON();

								await BudgetRecurrenceState.create(vnode.attrs.data);
							}

							return BudgetTransactionState.read(true);
						});

				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Budget,
				}),
				m(FormItem, {
					name: AuthAccountState.translate(ObjectAccount),
					select: {
						oninput: (e: string): void => {
							if (vnode.attrs.data.template.accounts!== null && vnode.attrs.data.template.accounts.length === 1) {
								vnode.attrs.data.template.accounts[0].budgetAccountID = e;
							} else {
								vnode.attrs.data.template.accounts = [
									{
										...BudgetTransactionState.newAccount(),
										...{
											amount: vnode.attrs.data.template.amount,
											budgetAccountID: e,
											id: UUID.new(),
										},
									},
								];
							}
						},
						options: BudgetAccountState.data(),
						required: true,
						value: vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 0 ?
							vnode.attrs.data.template.accounts[0].budgetAccountID :
							"",
					},
					tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
				}),
				m(FormItemInputDate, {
					name: AuthAccountState.translate(WebGlobalDate),
					oninput: (e: string): void => {
						vnode.attrs.data.template.date = e;

						if (vnode.attrs.data.template.categories !== null) {
							const yearMonth = CivilDate.fromString(e)
								.toYearMonth()
								.toNumber();
							for (const category of vnode.attrs.data.template.categories) {
								category.yearMonth = yearMonth;
							}
						}
						BudgetTransactionState.lastDate = e;
					},
					required: true,
					tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionDateTooltip),
					value: vnode.attrs.data.template.date,
				}),
				!state.formAccount.visible && (vnode.attrs.data.template.accounts === null || vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length <= 2) ?
					m(FormItem, {
						input: {
							datalist: [
								...BudgetAccountState.names()
									.reduce((accounts, account) => {
										if (vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 0 && account !== BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).name) {
											accounts.push(`${AuthAccountState.translate(WebBudgetTransactionsTransferTo)} ${account}`);
										}

										return accounts;
									}, [] as string[]),
								...vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length === 1 && BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).budget ?
									BudgetPayeeState.names() :
									[],
							],
							oninput: (e: string): void => {
								if (e.startsWith(AuthAccountState.translate(WebBudgetTransactionsTransferTo))) {
									const a = BudgetAccountState.findName(e.replace(`${AuthAccountState.translate(WebBudgetTransactionsTransferTo)} `, ""));
									if (a.name !== "" && vnode.attrs.data.template.accounts !== null) {
										if (a.budget) {
											vnode.attrs.data.template.categories = [];
										} else if (a.budget === BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).budget) { //
											vnode.attrs.data.template.amount = 0;
										} else {
											vnode.attrs.data.template.amount = vnode.attrs.data.template.accounts[0].amount;
										}

										vnode.attrs.data.template.budgetPayeeID = null;
										vnode.attrs.data.template.budgetPayeeName = "";
										vnode.attrs.data.template.accounts[1] = {
											...BudgetTransactionState.newAccount(),
											...{
												amount: vnode.attrs.data.template.accounts[0].amount * -1,
												budgetAccountID: a.id,
												id: UUID.new(),
											},
										};
									}

									return;
								}

								if (vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 1) {
									vnode.attrs.data.template.accounts = [
										vnode.attrs.data.template.accounts[0],
									];
								}

								vnode.attrs.data.template.amount = vnode.attrs.data.template.accounts === null || vnode.attrs.data.template.accounts.length === 0 ?
									0 :
									vnode.attrs.data.template.accounts[0].amount;

								const p = BudgetPayeeState.findName(e);
								if (p.name === "") {
									vnode.attrs.data.template.budgetPayeeID = null;
									vnode.attrs.data.template.budgetPayeeName = e;
								} else {
									vnode.attrs.data.template.budgetPayeeName = "";
									vnode.attrs.data.template.budgetPayeeID = p.id;

									if (p.budgetCategoryID !== null) {
										if (vnode.attrs.data.template.categories === null || vnode.attrs.data.template.categories.length === 0) {
											vnode.attrs.data.template.categories = [
												{
													...BudgetTransactionState.newCategory(),
													...{
														budgetCategoryID: p.budgetCategoryID,
														id: UUID.new(),
														yearMonth: CivilDate.now()
															.toYearMonth()
															.toNumber(),
													},
												},
											];
										} else if (vnode.attrs.data.template.categories.length === 1) {
											vnode.attrs.data.template.categories[0].budgetCategoryID = p.budgetCategoryID;
										}
										m.redraw();
									}
								}
							},
							required: false,
							type: "text",
							value: vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length === 2 ?
								`${AuthAccountState.translate(WebBudgetTransactionsTransferTo)} ${BudgetAccountState.findID(vnode.attrs.data.template.accounts[1].budgetAccountID).name}` :
								BudgetPayeeState.findID(vnode.attrs.data.template.budgetPayeeID).name === "" ?
									vnode.attrs.data.template.budgetPayeeName :
									BudgetPayeeState.findID(vnode.attrs.data.template.budgetPayeeID).name,
						},
						name: AuthAccountState.translate(ObjectPayee),
						tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionPayeeTooltip),
					}) :
					[
						m(Table, {
							actions: [],
							data: state.accounts(),
							editOnclick: (b: BudgetTransactionAccount): void => {
								state.formAccount.data = b;
								state.formAccount.visible = true;
							},
							filters: [],
							getKey: (data: BudgetTransactionAccount): string => {
								return `${data.id}+${data.budgetAccountID}`;
							},
							id: "accounts",
							loaded: true,
							noFilters: true,
							tableColumns: [
								{
									formatter: (e: BudgetTransactionAccount): string => {
										return BudgetAccountState.findID(e.budgetAccountID).name;
									},
									name: AuthAccountState.translate(WebGlobalName),
									noFilter: true,
									property: "budgetAccountID",
								},
								{
									name: AuthAccountState.translate(WebGlobalBudgetAmount),
									noFilter: true,
									property: "amount",
									type: TableDataType.Currency,
								},
								{
									formatter: (e: BudgetTransactionAccount): string => {
										switch (e.status) {
										case BudgetTransactionAccountStatusEnum.Cleared:
											return AuthAccountState.translate(WebGlobalTransactionStatusCleared);
										case BudgetTransactionAccountStatusEnum.Uncleared:
											return AuthAccountState.translate(WebGlobalTransactionStatusUncleared);
										case BudgetTransactionAccountStatusEnum.Reconciled:
											return AuthAccountState.translate(WebGlobalTransactionStatusReconciled);
										}
									},
									name: AuthAccountState.translate(WebGlobalStatus),
									noFilter: true,
									property: "status",
								},
							],
							tableColumnsNameEnabled: state.columnsAccounts,
							title: {
								name: AuthAccountState.translate(ObjectAccounts),
								subtitles: vnode.attrs.data.template.accounts === null || vnode.attrs.data.template.accounts.length === 0 ?
									[] :
									[
										{
											color: addAmounts(vnode.attrs.data.template.accounts) === 0 ?
												"var(--color_positive)" :
												"var(--color_negative)",
											key: `${AuthAccountState.translate(WebBudgetCategoriesRemaining)}:`,
											value: Currency.toString(addAmounts(vnode.attrs.data.template.accounts), AuthHouseholdState.findID(vnode.attrs.data.template.authHouseholdID).preferences.currency),
										},
									],
							},
						}),
						state.formAccount.visible ?
							m(Form, {
								buttons: [
									{
										accent: true,
										name: AuthAccountState.translate(ActionDelete),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												if (vnode.attrs.data.template.accounts !== null) {
													const i = vnode.attrs.data.template.accounts.findIndex((account) => {
														return account.id === state.formAccount.data.id;
													});
													vnode.attrs.data.template.accounts.splice(i, 1);
												}

												state.formAccount.visible = false;

												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
										requireOnline: false,
									},
									{
										name: AuthAccountState.translate(ActionCancel),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.formAccount.visible = false;

												return resolve();
											});
										},
										permitted: true,
										requireOnline: false,
									},
									{
										name: state.formAccount.data.id === null ?
											AuthAccountState.translate(ActionAdd) :
											AuthAccountState.translate(ActionUpdate),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.formAccount.visible = false;

												if (state.formAccount.data.id === null) {
													state.formAccount.data.id = UUID.new();

													if (vnode.attrs.data.template.accounts === null) {
														vnode.attrs.data.template.accounts = [];
													}

													vnode.attrs.data.template.accounts.push(state.formAccount.data);
												} else if (vnode.attrs.data.template.accounts !== null) {
													const i = vnode.attrs.data.template.accounts.findIndex((account) => {
														return account.id === state.formAccount.data.id;
													});
													vnode.attrs.data.template.accounts[i] = state.formAccount.data;
												}

												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
										primary: true,
										requireOnline: false,
									},
								],
								overlay: true,
								title: {
									name: `${state.formAccount.data.id === null ?
										AuthAccountState.translate(ActionNew) :
										AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectAccount)}`,
								},
							}, [
								m(FormItem, {
									name: AuthAccountState.translate(WebGlobalName),
									select: {
										oninput: (e: string): void => {
											state.formAccount.data.budgetAccountID = BudgetAccountState.findName(e).id;
										},
										options: BudgetAccountState.names(),
										required: true,
										value: BudgetAccountState.findID(state.formAccount.data.budgetAccountID).name,
									},
									tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
								}),
								m(FormItemInputCurrency, {
									format: AuthHouseholdState.findID(vnode.attrs.data.authHouseholdID).preferences.currency,
									name: AuthAccountState.translate(WebGlobalBudgetAmount),
									oninput: (e: number): void => {
										state.formAccount.data.amount = e;
									},
									required: true,
									tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionAmountTooltip),
									value: state.formAccount.data.amount,
								}),
							]) :
							[],
					],
				vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 1 ?
					m(Button, {
						name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectAccount)}`,
						onclick: async (): Promise<void> => {
							return new Promise((resolve) => {
								state.formAccount.data = BudgetTransactionState.newAccount();
								let amount = 0;

								if (vnode.attrs.data.template.accounts !== null) {
									for (const account of vnode.attrs.data.template.accounts) {
										amount += account.amount;
									}
								}

								state.formAccount.data.amount = amount;
								state.formAccount.visible = true;

								return resolve();
							});
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
						requireOnline: true,
					}) :
					[],
				m(FormItemInputCurrency, {
					format: AuthHouseholdState.findID(vnode.attrs.data.authHouseholdID).preferences.currency,
					name: AuthAccountState.translate(WebGlobalBudgetAmount),
					oninput: (e: number): void => {
						if (vnode.attrs.data.template.budgetPayeeID !== null || vnode.attrs.data.template.budgetPayeeName !== "") {
							vnode.attrs.data.template.amount = e;
						}

						if (vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 0) {
							vnode.attrs.data.template.accounts[0].amount = e;

							if (vnode.attrs.data.template.accounts.length === 2) {
								vnode.attrs.data.template.accounts[1].amount = e * -1;

								if (BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).budget === BudgetAccountState.findID(vnode.attrs.data.template.accounts[1].budgetAccountID).budget) {
									vnode.attrs.data.template.amount = 0;
								} else {
									vnode.attrs.data.template.amount = e;
								}
							}
						}

						if (vnode.attrs.data.template.categories !== null && vnode.attrs.data.template.categories.length === 1) {
							vnode.attrs.data.template.categories[0].amount = e;
						}
					},
					required: false,
					tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionAmountTooltip),
					value: vnode.attrs.data.template.budgetPayeeID !== null || vnode.attrs.data.template.budgetPayeeName !== "" || vnode.attrs.data.template.accounts === null || vnode.attrs.data.template.accounts.length === 0 ?
						vnode.attrs.data.template.amount :
						vnode.attrs.data.template.accounts !== null && vnode.attrs.data.template.accounts.length > 0 ?
							vnode.attrs.data.template.accounts[0].amount :
							0,
				}),
				vnode.attrs.data.template.accounts === null || vnode.attrs.data.template.accounts.length === 1 && BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).budget || vnode.attrs.data.template.accounts.length === 2 && BudgetAccountState.findID(vnode.attrs.data.template.accounts[0].budgetAccountID).budget !== BudgetAccountState.findID(vnode.attrs.data.template.accounts[1].budgetAccountID).budget || vnode.attrs.data.template.accounts.length > 2 ?
					[
						!state.formCategory.visible && (vnode.attrs.data.template.categories === null || vnode.attrs.data.template.categories !== null && (vnode.attrs.data.template.categories.length === 0 || vnode.attrs.data.template.categories.length === 1 && vnode.attrs.data.template.categories[0].amount === vnode.attrs.data.template.amount)) ?
							[
								m(FormItem, {
									name: AuthAccountState.translate(ObjectCategory),
									select: {
										oninput: (e: string): void => {
											if (e === "") {
												vnode.attrs.data.template.categories = [];
											} else if (vnode.attrs.data.template.categories !== null && vnode.attrs.data.template.categories.length === 1) {
												vnode.attrs.data.template.categories[0].budgetCategoryID = BudgetCategoryState.findGroupName(e).id;
											} else {
												vnode.attrs.data.template.categories = [
													{
														...BudgetTransactionState.newCategory(),
														...{
															amount: vnode.attrs.data.template.amount,
															budgetCategoryID: BudgetCategoryState.findGroupName(e).id,
															id: UUID.new(),
															yearMonth: CivilDate.now()
																.toYearMonth()
																.toNumber(),
														},
													},
												];
											}
										},
										options: [
											"",
											...BudgetCategoryState.names(),
										],
										value: vnode.attrs.data.template.categories === null || vnode.attrs.data.template.categories.length === 0 ?
											"" :
											BudgetCategoryState.findIDHeaderName(vnode.attrs.data.template.categories[0].budgetCategoryID),
									},
									tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionCategoryTooltip),
								}),
								vnode.attrs.data.template.categories !== null && vnode.attrs.data.template.categories.length === 1 ?
									m(FormItem, {
										input: {
											oninput: (e: string): void => {
												if (vnode.attrs.data.template.categories !== null && vnode.attrs.data.template.categories.length === 1) {
													if (e === "") {
														vnode.attrs.data.template.categories[0].yearMonth = 0;
														return;
													}
													const yearMonth = YearMonth.fromNumber(vnode.attrs.data.template.categories[0].yearMonth);
													yearMonth.fromInput(e);
													vnode.attrs.data.template.categories[0].yearMonth = yearMonth.toNumber();
												}
											},
											required: true,
											type: "month",
											value: YearMonth.fromNumber(vnode.attrs.data.template.categories[0].yearMonth)
												?.toValue(),
										},
										name: AuthAccountState.translate(WebGlobalBudgetMonth),
										tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionMonthTooltip),
									}) :
									[],
							] :
							m(Table, {
								actions: [],
								data: state.categories(),
								editOnclick: (b: BudgetTransactionCategory): void => {
									state.formCategory.data = b;
									state.formCategory.visible = true;
								},
								filters: [],
								getKey: (data: BudgetTransactionCategory): string => {
									return `${data.id}+${data.budgetCategoryID}`;
								},
								id: "categories",
								loaded: true,
								noFilters: true,
								tableColumns: [
									{
										formatter: (e: BudgetTransactionCategory): string => {
											return BudgetCategoryState.findIDHeaderName(e.budgetCategoryID);
										},
										name: AuthAccountState.translate(WebGlobalName),
										noFilter: true,
										property: "budgetCategoryID",
									},
									{
										name: AuthAccountState.translate(WebGlobalBudgetAmount),
										noFilter: true,
										property: "amount",
										type: TableDataType.Currency,
									},
									{
										formatter: (e: BudgetTransactionCategory): string => {
											return YearMonth.fromNumber(e.yearMonth)!.toString(); // eslint-disable-line @typescript-eslint/no-non-null-assertion
										},
										name: AuthAccountState.translate(WebGlobalBudgetMonth),
										noFilter: true,
										property: "yearMonth",
									},
								],
								tableColumnsNameEnabled: state.columnsCategories,
								title: {
									name: AuthAccountState.translate(ObjectCategories),
									subtitles: vnode.attrs.data.template.categories === null || vnode.attrs.data.template.categories.length === 0 ?
										[] :
										[
											{
												color: addAmounts(vnode.attrs.data.template.categories) - vnode.attrs.data.template.amount === 0 ?
													"var(--color_positive)" :
													"var(--color_negative)",
												key: `${AuthAccountState.translate(WebBudgetCategoriesRemaining)}:`,
												value: Currency.toString(addAmounts(vnode.attrs.data.template.categories) - vnode.attrs.data.template.amount, AuthHouseholdState.findID(vnode.attrs.data.template.authHouseholdID).preferences.currency),
											},
										],
								},
							}),
						state.formCategory.visible ?
							m(Form, {
								buttons: [
									{
										accent: true,
										name: AuthAccountState.translate(ActionDelete),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												if (vnode.attrs.data.template.categories !== null) {
													const i = vnode.attrs.data.template.categories.findIndex((category) => {
														return category.id === state.formCategory.data.id;
													});
													vnode.attrs.data.template.categories.splice(i, 1);
												}

												state.formCategory.visible = false;

												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
										requireOnline: false,
									},
									{
										name: AuthAccountState.translate(ActionCancel),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.formCategory.visible = false;

												return resolve();
											});
										},
										permitted: true,
										requireOnline: false,
									},
									{
										name: state.formCategory.data.id === null ?
											AuthAccountState.translate(ActionAdd) :
											AuthAccountState.translate(ActionUpdate),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.formCategory.visible = false;

												if (state.formCategory.data.id === null) {
													state.formCategory.data.id = UUID.new();

													if (vnode.attrs.data.template.categories=== null) {
														vnode.attrs.data.template.categories = [];
													}

													vnode.attrs.data.template.categories.push(state.formCategory.data);
												} else if (vnode.attrs.data.template.categories !== null) {
													const i = vnode.attrs.data.template.categories.findIndex((category) => {
														return category.id === state.formCategory.data.id;
													});
													vnode.attrs.data.template.categories[i] = state.formCategory.data;
												}

												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true, vnode.attrs.data.authHouseholdID),
										primary: true,
										requireOnline: false,
									},
								],
								overlay: true,
								title: {
									name: `${state.formCategory.data.id === null ?
										AuthAccountState.translate(ActionNew) :
										AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectCategory)}`,
								},
							}, [
								m(FormItem, {
									name: AuthAccountState.translate(WebGlobalName),
									select: {
										oninput: (e: string): void => {
											state.formCategory.data.budgetCategoryID = BudgetCategoryState.findGroupName(e).id;
										},
										options: BudgetCategoryState.names(),
										required: true,
										value: BudgetCategoryState.findIDHeaderName(state.formCategory.data.budgetCategoryID),
									},
									tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
								}),
								m(FormItemInputCurrency, {
									format: AuthHouseholdState.findID(vnode.attrs.data.authHouseholdID).preferences.currency,
									name: AuthAccountState.translate(WebGlobalBudgetAmount),
									oninput: (e: number): void => {
										state.formCategory.data.amount = e;
									},
									required: true,
									tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionAmountTooltip),
									value: state.formCategory.data.amount,
								}),
								m(FormItem, {
									input: {
										oninput: (e: string): void => {
											if (e === "") {
												state.formCategory.data.yearMonth = 0;
												return;
											}
											const yearMonth = YearMonth.fromNumber(state.formCategory.data.yearMonth);
											yearMonth.fromInput(e);
											state.formCategory.data.yearMonth = yearMonth.toNumber();
										},
										required: true,
										type: "month",
										value: YearMonth.fromNumber(state.formCategory.data.yearMonth)
											?.toValue(),
									},
									name: AuthAccountState.translate(WebGlobalBudgetMonth),
									tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionMonthTooltip),
								}),
							]) :
							[],
						m(Button, {
							name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectCategory)}`,
							onclick: async (): Promise<void> => {
								return new Promise((resolve) => {
									state.formCategory.data = BudgetTransactionState.newCategory();
									let categoryAmount = 0;

									if (vnode.attrs.data.template.categories !== null) {
										for (const category of vnode.attrs.data.template.categories) {
											categoryAmount += category.amount;
										}
									}

									state.formCategory.data.amount = vnode.attrs.data.template.amount - categoryAmount;

									if (vnode.attrs.data.template.date !== null) {
										state.formCategory.data.yearMonth = CivilDate.fromString(vnode.attrs.data.template.date)
											.toYearMonth()
											.toNumber();
									}

									state.formCategory.visible = true;

									return resolve();
								});
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true),
							requireOnline: true,
						}),
					] :
					[],
				m(FormItem, {
					input: {
						markdown: true,
						oninput: (e: string): void => {
							vnode.attrs.data.template.note = e;
						},
						required: false,
						type: "text",
						value: vnode.attrs.data.template.note,
					},
					name: AuthAccountState.translate(ObjectNote),
					tooltip: AuthAccountState.translate(WebFormOverlayBudgetTransactionNoteTooltip),
				}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayBudgetTransactionDontRoll),
					onclick: () => {
						vnode.attrs.data.template.keep = ! vnode.attrs.data.template.keep;
					},
					value: vnode.attrs.data.template.keep,
				}),
				m.route.param()
					.import === undefined ?
					m(FormCheckbox, {
						name: AuthAccountState.translate(WebGlobalRecurring),
						onclick: () => {
							vnode.attrs.data.recurrence.separation = vnode.attrs.data.recurrence.separation === 0 ?
								1 :
								0;
						},
						value: vnode.attrs.data.recurrence.separation !== 0,
					}) :
					[],
				vnode.attrs.data.recurrence.separation > 0 ?
					m(FormRecurrence, {
						recurrence: vnode.attrs.data.recurrence,
						startDate: vnode.attrs.data.template.date,
					}) :
					[],
			]);
		},
	};
}
