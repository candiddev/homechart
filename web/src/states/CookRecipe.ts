import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import fraction from "fraction.js";
import m from "mithril";

import { API, ErrUnknownResponse } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import { ObjectRecipeCreated, ObjectRecipeDeleted, ObjectRecipeUpdated, WebGlobalActionImportRecipeFailure, WebGlobalActionImportRecipeSuccess } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";
import { InventoryItemState } from "./InventoryItem";

export interface CookRecipe {
	authHouseholdID: NullUUID,
	complexity: number,
	cookMealPlanCount: number,
	cookMealPlanLast: NullCivilDate,
	created: NullTimestamp,
	deleted:  NullTimestamp,
	directions: string,
	id: NullUUID,
	image: string,
	ingredients: string,
	notes: CookRecipeNote[],
	name: string,
	public: boolean,
	rating: number,
	servings: string,
	shortID: string,
	source: string,
	tags: string[],
	timeCook: number,
	timePrep: number,
	updated: NullTimestamp,
}

export interface CookRecipeNote {
	date: NullCivilDate,
	complexity: number,
	note: string,
	rating: number,
}

const containsNumber = /\d+/;
const isNumber = /^\d+$/;
const isFraction = /^\d+\/\d+$/;

class CookRecipeManager extends DataArrayManager<CookRecipe> {
	constructor () {
		super("/api/v1/cook/recipes", "name", false, DataTypeEnum.CookRecipe);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";

		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectRecipeCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectRecipeDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectRecipeUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	getInventoryIngredients (ingredients: string): string {
		let ingredientsInventory = "";

		const lines = ingredients.split("\n");

		for (let i = 0; i < lines.length; i++) {
			let match = false;

			if (! lines[i].startsWith("#")) {
				for (const item of InventoryItemState.data()) {
					if (item.quantity > 0 && lines[i].toLowerCase()
						.includes(item.name.toLowerCase())) {
						ingredientsInventory += `${lines[i]} #inventoryitem/${item.shortID}?icon\n`;

						match = true;
						break;
					}
				}
			}

			if (! match) {
				ingredientsInventory += `${lines[i]}`;
				if (i !== lines.length - 1) {
					ingredientsInventory += "\n";
				}
			}
		}

		return ingredientsInventory;
	}

	async importURL (url: string, authHouseholdID: NullUUID): Promise<void | Err> {
		return API.create("/api/v1/import/recipe", {
			authHouseholdID: authHouseholdID,
			url: url,
		})
			.then(async (response) => {
				if (IsErr(response)) {
					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(WebGlobalActionImportRecipeFailure),
					});
					return response;
				}

				if (this.containsResponse(response)) {
					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(WebGlobalActionImportRecipeSuccess),
					});

					this.set(response.dataValue[0]);

					m.route.set(`/cook/recipes/${response.dataValue[0].id}`, {}, {
						state: {
							key: Date.now(),
						},
					});

					return;
				}

				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(WebGlobalActionImportRecipeFailure),
				});

				return ErrUnknownResponse;
			});
	}

	override new (): CookRecipe {
		return {
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			complexity: 0,
			cookMealPlanCount: 0,
			cookMealPlanLast: null,
			created: null,
			deleted: null,
			directions: "",
			id: null,
			image: "",
			ingredients: "",
			name: "",
			notes: [],
			public: false,
			rating: 0,
			servings: "",
			shortID: "",
			source: "",
			tags: [],
			timeCook: 0,
			timePrep: 0,
			updated: null,
		};
	}

	newLog (): CookRecipeNote {
		return {
			complexity: 0,
			date: null,
			note: "",
			rating: 0,
		};
	}

	scaleIngredient (line: string, scale: string): string {
		let newLine = "";

		const words = line.split(" ");
		for (let i = 0; i < words.length; i++) {
			if (words[i].startsWith("(")) {
				newLine += "(";
				words[i] = words[i].slice(1);
			}

			if (isNumber.test(words[i]) || isFraction.test(words[i])) {
				if (isFraction.test(words[i + 1])) {
					newLine += new fraction(`${words[i]} ${words[i + 1]}`)
						.mul(scale)
						.toFraction(true);
					i++;
				} else if (isNumber.test(words[i + 1])) {
					newLine += `${new fraction(words[i])
						.mul(scale)
						.toFraction(true)} ${words[i + 1]}`;
					i++;
				} else {
					newLine += new fraction(words[i])
						.mul(scale)
						.toFraction(true);
				}
			} else {
				newLine += words[i];
			}

			if (i < words.length - 1) {
				newLine += " ";
			}
		}

		return newLine;
	}

	scaleIngredients (ingredients: string, scale: string | undefined): string {
		const inventoryIngredients = this.getInventoryIngredients(ingredients);

		if (scale === "" || scale === null || scale === undefined) {
			return inventoryIngredients;
		}

		let ingredientsNew = "";

		const lines = inventoryIngredients.split("\n");
		for (let i = 0; i < lines.length; i++) {
			if (containsNumber.test(lines[i])) {
				ingredientsNew += this.scaleIngredient(lines[i],scale);
			} else {
				ingredientsNew += lines[i];
			}

			if (i < lines.length - 1) {
				ingredientsNew += "\n";
			}
		}

		return ingredientsNew;
	}
}

export const CookRecipeState = new CookRecipeManager();
