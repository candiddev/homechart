import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import { ObjectPayeeCreated, ObjectPayeeDeleted, ObjectPayeeUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface BudgetPayee {
	[index: string]: boolean | null | number | string,
	address: string,
	authHouseholdID: NullUUID,
	budgetCategoryID: NullUUID,
	budgetTransactionAmount: number,
	created: NullTimestamp,
	icon: string,
	id: NullUUID,
	name: string,
	shopStore: boolean,
	shortID: string,
	updated: NullTimestamp,
}

class BudgetPayeeManager extends DataArrayManager<BudgetPayee> {
	storeNames = this.data.map((payees) => {
		const names: string[] = [];

		for (const payee of payees) {
			if (payee.shopStore) {
				names.push(payee.name);
			}
		}

		return names;
	});

	constructor () {
		super("/api/v1/budget/payees", "name", false, DataTypeEnum.BudgetPayee);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectPayeeCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectPayeeDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectPayeeUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	override new (): BudgetPayee {
		return {
			address: "",
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			budgetCategoryID: null,
			budgetTransactionAmount: 0,
			created: null,
			icon: "",
			id: null,
			name: "",
			shopStore: false,
			shortID: "",
			updated: null,
		};
	}
}

export const BudgetPayeeState = new BudgetPayeeManager();
