import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import type { MonthEnum } from "@lib/types/Month";
import { Sort } from "@lib/utilities/Sort";

import { DataTypeEnum } from "../types/DataType";
import { ObjectCategoryCreated, ObjectCategoryDeleted, ObjectCategoryUpdated, WebGlobalHidden } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface BudgetCategory {
	authHouseholdID: NullUUID,
	budgetMonthCategoryAmount: number,
	budgetTransactionAmount: number,
	created: NullTimestamp,
	grouping: string,
	id: NullUUID,
	income: boolean,
	name: string,
	shortID: string,
	targetAmount: number,
	targetMonth: MonthEnum,
	targetYear: number,
	updated: NullTimestamp,
}

class BudgetCategoryManager extends DataArrayManager<BudgetCategory> {
	groupingNames = this.data.map((categories) => {
		const groupings: string[] = [];

		for (const category of categories) {
			if (category.grouping !== "" && !groupings.includes(category.grouping)) {
				groupings.push(category.grouping);
			}
		}
		Sort(groupings);
		return groupings;
	});
	override names = this.data.map((categories) => {
		const hidden: string[] = [];
		const names = categories.reduce((a, c) => {
			if (c.grouping === "") {
				hidden.push(`${AuthAccountState.translate(WebGlobalHidden)} > ${c.name}`);
			} else {
				a.push(`${c.grouping} > ${c.name}`);
			}

			return a;
		}, [] as string[]);
		Sort(names);
		Sort(hidden);
		names.push(...hidden);
		return names;
	});
	nameOptions = this.names.map((names) => {
		return names.map((name) => {
			return {
				id: BudgetCategoryState.findGroupName(name).id,
				name: name,
			};
		});
	});

	constructor () {
		super(
			"/api/v1/budget/categories",
			"name",
			false,
			DataTypeEnum.BudgetCategory,
		);
	}


	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectCategoryCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectCategoryDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectCategoryUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	findGroupName (name: string): BudgetCategory {
		const c: string[] = name.split(" > ");
		if (c.length === 2) {
			if (c[0] === AuthAccountState.translate(WebGlobalHidden)) {
				c[0] = "";
			}
			const b = this.data()
				.find((category) => {
					return category.grouping === c[0] && category.name === c[1];
				});

			if (b !== undefined) {
				return b;
			}
		}
		return this.new();
	}

	findIDHeaderName (id: NullUUID): string {
		const b = this.data()
			.find((category) => {
				return category.id === id;
			});
		if (b === undefined) {
			return "";
		}
		if (b.grouping === "") {
			return `${AuthAccountState.translate(WebGlobalHidden)} > ${b.name}`;
		}
		return `${b.grouping} > ${b.name}`;
	}

	override new (): BudgetCategory {
		return {
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			budgetMonthCategoryAmount: 0,
			budgetTransactionAmount: 0,
			created: null,
			grouping: "",
			id: null,
			income: false,
			name: "",
			shortID: "",
			targetAmount: 0,
			targetMonth: 0,
			targetYear: 0,
			updated: null,
		};
	}
}

export const BudgetCategoryState = new BudgetCategoryManager();
