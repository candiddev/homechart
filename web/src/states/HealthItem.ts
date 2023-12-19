import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Clone } from "@lib/utilities/Clone";

import { API } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import { ObjectItemCreated, ObjectItemDeleted, ObjectItemUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface HealthItem {
	authAccountID: NullUUID,
	color: string,
	correlations: {
		[key: string]: number | undefined,
	},
	created: NullTimestamp,
	id: NullUUID,
	name: string,
	output: boolean,
	totalCorrelations: number,
	updated: NullTimestamp,
}

class HealthItemManager extends DataArrayManager<HealthItem> {
	constructor () {
		super("/api/v1/health/items", "name", false, DataTypeEnum.HealthItem);
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

	findAuthAccountID (authAccountID: NullUUID, output?: boolean): HealthItem[] {
		return this.data()
			.filter((item) => {
				return item.authAccountID === authAccountID && (output === undefined || item.output === output);
			});
	}

	findAuthAccountIDName (authAccountID: NullUUID, name: string): HealthItem {
		const i = this.data()
			.findIndex((item) => {
				return item.authAccountID === authAccountID && item.name === name;
			});

		if (i >= 0 && this.data().length > 0) {
			return Clone(this.data()[i]);
		}

		return this.new();
	}

	async init (authAccountID: NullUUID): Promise<void> {
		await API.update(`/api/v1/health/items?authAccountID=${authAccountID}`)
			.then(() => {});
	}

	override new (): HealthItem {
		return {
			authAccountID: AuthAccountState.data().id,
			color: "",
			correlations: {},
			created: null,
			id: null,
			name: "",
			output: false,
			totalCorrelations: 0,
			updated: null,
		};
	}
}

export const HealthItemState = new HealthItemManager();
