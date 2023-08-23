import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Sort } from "@lib/utilities/Sort";

import { API } from "../services/API";
import { WebGlobalHidden } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import type { BudgetCategory } from "./BudgetCategory";
import { BudgetCategoryState } from "./BudgetCategory";
import type { BudgetMonth } from "./BudgetMonth";

export interface BudgetMonthCategory {
	amount: number,
	authHouseholdID: NullUUID,
	balance: number,
	budgetCategory: BudgetCategory,
	budgetCategoryID: NullUUID,
	budgetTransactionAmount: number,
	created: NullTimestamp,
	grouping?: boolean, // not sent by API
	id?: NullUUID, // not sent by API
	yearMonth: number,
}

export const BudgetMonthCategoryState = {
	create: async (category: BudgetMonthCategory): Promise<void | Err> => {
		return API.create("/api/v1/budget/month-categories", category)
			.then((err) => {
				if (IsErr(err)) {
					AppState.setLayoutAppAlert(err);

					return err;
				}

				return;
			});
	},
	getIndex: (categories: BudgetMonthCategory[], name: string): number => {
		return categories.findIndex((category) => {
			return category.budgetCategory.name === name;
		});
	},
	groupingSort: (b: BudgetMonth): BudgetMonthCategory[] => {
		if (b.budgetMonthCategories === null || b.budgetMonthCategories.length === 0) {
			b.budgetMonthCategories = BudgetCategoryState.data()
				.map((category) => {
					return {
						...BudgetMonthCategoryState.new(),
						...{
							authHouseholdID: category.authHouseholdID,
							budgetCategory: category,
							budgetCategoryID: category.id,
						},
					};
				});
		}

		Sort(b.budgetMonthCategories, {
			formatter: (obj) => {
				if (BudgetMonthCategoryState.is(obj)) {
					return `${obj.budgetCategory.grouping}-${obj.budgetCategory.name}`;
				}
				return "";
			},
		});

		const bnew: BudgetMonthCategory[] = [];
		const bhidden: BudgetMonthCategory[] = [
			{
				...BudgetMonthCategoryState.new(),
				...{
					budgetCategory: {
						...BudgetCategoryState.new(),
						...{
							name: AuthAccountState.translate(WebGlobalHidden),
						},
					},
				},
			},
		];

		for (const budget of b.budgetMonthCategories) {
			if (budget.budgetCategory.grouping === "") {
				if (b.yearMonth === budget.yearMonth) {
					bhidden[0].amount += budget.amount;
					bhidden[0].budgetTransactionAmount += budget.budgetTransactionAmount;
				}

				bhidden[0].yearMonth = budget.yearMonth;
				budget.budgetCategory.grouping = AuthAccountState.translate(WebGlobalHidden);
				bhidden.push(budget);
			} else {
				let i = BudgetMonthCategoryState.getIndex(bnew, budget.budgetCategory.grouping);
				if (i >= 0) {
					if (b.yearMonth === budget.yearMonth) {
						bnew[i].amount += budget.amount;
						bnew[i].budgetTransactionAmount += budget.budgetTransactionAmount;
					}

					bnew[i].yearMonth = budget.yearMonth;

					if (!budget.budgetCategory.income) {
						bnew[i].balance += budget.balance;
					}
				} else {
					i = bnew.push({
						...BudgetMonthCategoryState.new(),
						...{
							budgetCategory: {
								...BudgetCategoryState.new(),
								...{
									income: budget.budgetCategory.income,
									name: budget.budgetCategory.grouping,
								},
							},
						},
					});
					if (b.yearMonth === budget.yearMonth) {
						bnew[i - 1].amount = budget.amount;
						bnew[i - 1].budgetTransactionAmount = budget.budgetTransactionAmount;
					}

					if (!budget.budgetCategory.income) {
						bnew[i - 1].balance = budget.balance;
					}
				}
				bnew.push(budget);
			}
		}

		return bnew.concat(bhidden);
	},
	inResponse: (value: unknown): value is APIResponse<BudgetMonthCategory> => {
		return value !== null;
	},
	is: (value: unknown): value is BudgetMonthCategory => {
		return value !== null;
	},
	new: (): BudgetMonthCategory => {
		return {
			amount: 0,
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			balance: 0,
			budgetCategory: BudgetCategoryState.new(),
			budgetCategoryID: null,
			budgetTransactionAmount: 0,
			created: null,
			id: null,
			yearMonth: 0,
		};
	},
	targetAmount: (category: BudgetMonthCategory, y: number): number => {
		if (category.budgetCategory.targetAmount === 0) {
			return category.amount;
		}

		const month = parseInt(y.toString()
			.slice(4, 6), 10);
		const year = parseInt(y.toString()
			.slice(0, 4), 10);
		if (category.budgetCategory.targetMonth === 0 && category.budgetCategory.targetYear === 0) {
			return category.budgetCategory.targetAmount;
		}

		let m = 1;
		if (category.budgetCategory.targetAmount !== 0) {
			if (category.budgetCategory.targetMonth !== 0) {
				m += category.budgetCategory.targetMonth - month;
			}
			if (category.budgetCategory.targetYear !== 0) {
				m += (category.budgetCategory.targetYear - year) * 12;
			}
		}
		const amount = category.budgetCategory.targetAmount - category.balance + category.amount;
		if (m <= 0) {
			return amount;
		}
		return Math.ceil(amount / m);
	},
	update: async (data: BudgetMonthCategory): Promise<void> => {
		return API.update("/api/v1/budget/month-categories", data)
			.then(() => {
				BudgetCategoryState.alertAction(ActionsEnum.Update);
			});
	},
};
