import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import type { YearMonthDateRange } from "@lib/types/YearMonth";

import { API, ErrUnknownResponse } from "../services/API";

export interface ChartDataset {
	name: string,
	values: {
		name: string,
		value: number,
	}[],
}

export enum ChartDatasetTypesEnum {
	BudgetCategory,
	BudgetCategoryHeader,
	BudgetIncomeExpense,
	BudgetPayee,
}

export const ChartDatasetState = {
	inResponse (response: APIResponse<unknown>): response is APIResponse<ChartDataset[]> {
		return response.dataType === "ChartDatasets";
	},
	read: async (authHouseholdID: NullUUID, dateRange: YearMonthDateRange, type: ChartDatasetTypesEnum): Promise<ChartDataset[] | Err> => {
		return API.read(`/api/v1/charts/datasets/${authHouseholdID}/${type}?from=${dateRange.from.toNumber()}&to=${dateRange.to.toNumber()}`, {})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (ChartDatasetState.inResponse(response)) {
					return response.dataValue;
				}

				return ErrUnknownResponse;
			});
	},
};
