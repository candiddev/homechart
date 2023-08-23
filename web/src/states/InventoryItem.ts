import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Clone } from "@lib/utilities/Clone";
import { Sort } from "@lib/utilities/Sort";

import { API } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import { ObjectItemCreated, ObjectItemDeleted, ObjectItemUpdated, WebGlobalLocation } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface InventoryItem {
	authHouseholdID: NullUUID,
	created: NullTimestamp,
	id: NullUUID,
	image: string,
	lastPurchased: NullCivilDate,
	name: string,
	properties: {
		[key: string]: string | undefined,
	},
	qrcode?: string, // not sent by API
	qrlink?: string, // not sent by API
	quantity: number,
	shortID: string,
	upc: string,
	updated: NullTimestamp,
}

class InventoryItemManager extends DataArrayManager<InventoryItem> {
	constructor () {
		super("/api/v1/inventory/items", "name", false, DataTypeEnum.InventoryItem);
	}

	properties = this.data.map((items) => {
		const properties = new Set<string>();
		properties.add(AuthAccountState.translate(WebGlobalLocation));

		for (const item of items) {
			for (const property of Object.keys(item.properties)) {
				properties.add(property);
			}
		}

		const arr = Array.from(properties);

		Sort(arr);

		return arr;
	});

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

	findPropertyValues (property: string): string[] {
		const values = new Set<string>();

		for (const item of this.data()) {
			if (item.properties[property] !== undefined) {
				values.add(item.properties[property]!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			}
		}

		const arr = Array.from(values);

		Sort(arr);

		return arr;
	}

	findUPC (upc: string): InventoryItem {
		const i = this.data()
			.find((item) => {
				return item.upc === upc;
			});

		if (i === undefined) {
			return this.new();
		}

		return Clone(i);
	}

	getLink (id: NullUUID): string {
		return `${API.getLink()}/inventory/all?id=${id}`;
	}

	override new (): InventoryItem {
		return {
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			created: null,
			id: null,
			image: "",
			lastPurchased: null,
			name: "",
			properties: {},
			quantity: 1,
			shortID: "",
			upc: "",
			updated: null,
		};
	}
}

export const InventoryItemState = new InventoryItemManager();
