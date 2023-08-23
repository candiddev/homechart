import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import type { RecurrenceInterval } from "@lib/types/Recurrence";
import type Stream from "mithril/stream";

import { DataTypeEnum } from "../types/DataType";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectItemCreated, ObjectItemDeleted, ObjectItemUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface ShopItem {
	add?: boolean, // Not sent by API
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	budgetPayeeID: NullUUID,
	cookMealPlanID: NullUUID,
	cookRecipeID: NullUUID,
	created: NullTimestamp,
	id: NullUUID,
	inCart: boolean,
	name: string,
	nextDate: NullCivilDate,
	planProjectID: NullUUID,
	position: string,
	price: number,
	recurrence: RecurrenceInterval | null,
	shopCategoryID: NullUUID,
	shopListID: NullUUID,
	updated: NullTimestamp,
}

class ShopItemManager extends DataArrayManager<ShopItem> {
	constructor () {
		super("/api/v1/shop/items", "name", false, DataTypeEnum.ShopItem);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";

		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectItemCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectItemDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectItemUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	costItems (items: ShopItem[]): number {
		let cost = 0;

		for (let i = 0; i < items.length; i++) {
			cost += items[i].price;
		}

		return cost;
	}

	countItems (budgetPayeeID?: NullUUID): number {
		return this.data()
			.filter((item) => {
				if (budgetPayeeID !== undefined && item.budgetPayeeID !== budgetPayeeID) {
					return false;
				}

				return ! item.inCart && item.shopListID === null && (item.nextDate === null || CivilDate.fromString(item.nextDate) <= CivilDate.now());
			}).length;
	}

	findAdjacent (s: ShopItem): ShopItem[] {
		return this.data()
			.filter((item) => {
				return item.shopListID === s.shopListID;
			});
	}

	findPlanProjectID (planProjectID: NullUUID, items?: ShopItem[]): ShopItem[] {
		if (items === undefined) {
			items = this.data(); // eslint-disable-line no-param-reassign
		}

		if (planProjectID === null) {
			return [];
		}

		return items.filter((item) => {
			return item.planProjectID === planProjectID;
		});
	}

	getPickupItems (): ShopItem[] {
		const today = CivilDate.now();

		return this.data()
			.filter((item) => {
				return item.shopListID === null && (item.nextDate === null || CivilDate.fromString(item.nextDate)
					.valueOf() <= today.valueOf());
			});
	}

	getStaples (): Stream<ShopItem[]> {
		return this.data.map((items) => {
			return items.filter((item) => {
				return item.nextDate !== null;
			});
		});
	}

	override new (): ShopItem {
		const p = Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Shop, PermissionEnum.Edit, AuthAccountState.data().primaryAuthHouseholdID);

		return {
			authAccountID:
				p ?
					null :
					AuthAccountState.data().id,
			authHouseholdID:
				p ?
					AuthAccountState.data().primaryAuthHouseholdID :
					null,
			budgetPayeeID: null,
			cookMealPlanID: null,
			cookRecipeID: null,
			created: null,
			id: null,
			inCart: false,
			name: "",
			nextDate: null,
			planProjectID: null,
			position: "",
			price: 0,
			recurrence: null,
			shopCategoryID: null,
			shopListID: null,
			updated: null,
		};
	}
}

export const ShopItemState = new ShopItemManager();
