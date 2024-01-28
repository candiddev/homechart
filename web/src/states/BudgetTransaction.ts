import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import type { BudgetTransactionAccountStatusEnum } from "../types/BudgetTransactionAccountStatus";
import { ObjectTransactionCreated, ObjectTransactionDeleted, ObjectTransactionUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";

export interface BudgetTransaction {
	accounts: BudgetTransactionAccount[] | null,
	amount: number,
	authHouseholdID: NullUUID,
	balance: number,
	budgetPayeeID: NullUUID,
	budgetPayeeName: string,
	categories: BudgetTransactionCategory[] | null,
	created: NullTimestamp,
	date: NullCivilDate,
	id: NullUUID,
	keep: boolean,
	note: string,
}

export interface BudgetTransactionAccount {
	amount: number,
	budgetAccountID: NullUUID,
	budgetTransactionID: NullUUID,
	id: NullUUID,
	status: BudgetTransactionAccountStatusEnum,
}

export interface BudgetTransactionCategory {
	amount: number,
	budgetCategoryID: NullUUID,
	budgetTransactionID: NullUUID,
	id: NullUUID,
	yearMonth: number,
}

export const BudgetTransactionState = {
	contains: (value: unknown): value is BudgetTransaction => {
		return value !== null;
	},
	create: async (budgetTransaction: BudgetTransaction): Promise<void | Err> => {
		return API.create("/api/v1/budget/transactions", budgetTransaction)
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}

				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectTransactionCreated),
				});

				return;
			});
	},
	data: Stream([] as BudgetTransaction[]),
	delete: async (id: NullUUID): Promise<void> => {
		return API.delete(`/api/v1/budget/transactions/${id}`)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectTransactionDeleted),
				});
			});
	},
	inResponse (response: APIResponse<unknown>): response is APIResponse<BudgetTransaction[]> {
		return response.dataType === "BudgetTransactions";
	},
	is: (value: unknown): value is BudgetTransaction[] => {
		return value !== null;
	},
	isAccount: (value: unknown): value is BudgetTransactionAccount => {
		return value !== null;
	},
	isCategory: (value: unknown): value is BudgetTransactionCategory => {
		return value !== null;
	},
	lastDate: CivilDate.now()
		.toJSON(),
	load: async (): Promise<BudgetTransaction[]> => {
		return IndexedDB.get("BudgetTransactions")
			.then(async (data) => {
				if (BudgetTransactionState.is(data)) {
					return Clone(data);
				}
				return [];
			});
	},
	loaded: false,
	loadedLast: "",
	new: (): BudgetTransaction => {
		return {
			accounts: [],
			amount: 0,
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			balance: 0,
			budgetPayeeID: null,
			budgetPayeeName: "",
			categories: [],
			created: null,
			date: null,
			id: null,
			keep: false,
			note: "",
		};
	},
	newAccount: (): BudgetTransactionAccount => {
		return {
			amount: 0,
			budgetAccountID: null,
			budgetTransactionID: null,
			id: null,
			status: 0,
		};
	},
	newCategory: (): BudgetTransactionCategory => {
		return {
			amount: 0,
			budgetCategoryID: null,
			budgetTransactionID: null,
			id: null,
			yearMonth: 0,
		};
	},
	offset: 0,
	read: async (noLoad?: boolean): Promise<void | Err> => {
		if (noLoad !== true) {
			BudgetTransactionState.loaded = false;
		}

		let err: Err | void;

		if (m.route.param().account !== undefined) {
			err = await BudgetTransactionState.readAccount(m.route.param().account);
		} else if (m.route.param().category !== undefined) {
			if (m.route.param().month === undefined) {
				err = await BudgetTransactionState.readCategory(m.route.param().category);
			} else {
				err = await BudgetTransactionState.readCategoryMonth(m.route.param().category, parseInt(m.route.param().month, 10));
			}
		} else if (m.route.param().payee !== undefined) {
			err = await BudgetTransactionState.readPayee(m.route.param().payee);
		}

		BudgetTransactionState.loaded = true;

		return err;
	},
	readAccount: async (
		budgetAccountID: NullUUID,
	): Promise<void | Err> => {
		return API.read(`/api/v1/budget/accounts/${budgetAccountID}/transactions`, {
			offset: BudgetTransactionState.offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (BudgetTransactionState.inResponse(response)) {
					BudgetTransactionState.data(response.dataValue);
					BudgetTransactionState.total = response.dataTotal;

					m.redraw();
					return;
				}

				return ErrUnknownResponse;
			});
	},
	readCategory: async (
		budgetCategoryID: NullUUID,
	): Promise<void | Err> => {
		return API.read(`/api/v1/budget/categories/${budgetCategoryID}/transactions`, {
			offset: BudgetTransactionState.offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (BudgetTransactionState.inResponse(response)) {
					BudgetTransactionState.data(response.dataValue);
					BudgetTransactionState.total = response.dataTotal;

					m.redraw();
					return;
				}

				return ErrUnknownResponse;
			});
	},
	readCategoryMonth: async (
		budgetCategoryID: NullUUID,
		yearMonth: number,
	): Promise<void | Err> => {
		return API.read(`/api/v1/budget/categories/${budgetCategoryID}/transactions/${yearMonth}`, {
			offset: BudgetTransactionState.offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (BudgetTransactionState.inResponse(response)) {
					BudgetTransactionState.data(response.dataValue);
					BudgetTransactionState.total = response.dataTotal;

					m.redraw();
					return;
				}

				return ErrUnknownResponse;
			});
	},
	readPayee: async (
		budgetPayeeID: NullUUID,
	): Promise<void | Err> => {
		return API.read(`/api/v1/budget/payees/${budgetPayeeID}/transactions`, {
			offset: BudgetTransactionState.offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (BudgetTransactionState.inResponse(response)) {
					BudgetTransactionState.data(response.dataValue);
					BudgetTransactionState.total = response.dataTotal;

					m.redraw();
					return;
				}

				return ErrUnknownResponse;
			});
	},
	set: async (budgetTransactions: BudgetTransaction[]): Promise<void | Err> => {
		return IndexedDB.set("BudgetTransactions", budgetTransactions);
	},
	total: 0,
	update: async (data: BudgetTransaction): Promise<void | Err> => {
		return API.update(`/api/v1/budget/transactions/${data.id}`, data)
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}

				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectTransactionUpdated),
				});

				return;
			});
	},
};
