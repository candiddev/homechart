import { CSV } from "@lib/utilities/CSV";

import { InventoryItemState } from "../states/InventoryItem";

/* eslint-disable jsdoc/require-jsdoc */
export interface InventoryItemFields {
	[key: string]: string,
	Name: string,
	Quantity: string,
	UPC: string,
}

export async function CSVToInventoryItems (input: string, fields: InventoryItemFields): Promise<void> {
	const data = await CSV.import(input);

	if (data !== null) {
		for (const value of data.data as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
			const item = {
				...InventoryItemState.new(),
				... {
					name: value[fields.Name],
					upc: value[fields.UPC],
				},
			};

			if (fields.Quantity !== "") {
				const quantity = parseInt(value[fields.Quantity]);

				if (!isNaN(quantity)) {
					item.quantity = quantity;
				}
			}

			for (const field of Object.keys(fields)) {
				if (field !== "Name" && field !== "Quantity" && field !== "UPC") {
					item.properties[field] = value[fields[field]];
				}
			}

			await InventoryItemState.create(item);
		}
	}
}
