import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { API } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import type { BudgetMonthCategory } from "./BudgetMonthCategory";
import { BudgetMonthCategoryState } from "./BudgetMonthCategory";

export interface BudgetMonth {
  authHouseholdID: NullUUID;
  budgetMonthCategoryAmount: number;
  budgetMonthCategories: BudgetMonthCategory[];
  budgetTransactionAmountIncome: number;
  budgetTransactionAmountIncomeRemaining: number;
  targetAmount?: number; // not sent by API
  yearMonth: number;
}

function newBudgetMonth(): BudgetMonth {
  return {
    authHouseholdID: null,
    budgetMonthCategories: [],
    budgetMonthCategoryAmount: 0,
    budgetTransactionAmountIncome: 0,
    budgetTransactionAmountIncomeRemaining: 0,
    targetAmount: 0,
    yearMonth: 0,
  };
}

export const BudgetMonthState = {
  containsResponse: (
    response: APIResponse<unknown>,
  ): response is APIResponse<BudgetMonth[]> => {
    return response.dataType === "BudgetMonth";
  },
  data: Stream(newBudgetMonth()),
  groupings: ["Hidden"],
  inResponse: (
    response: APIResponse<unknown>,
  ): response is APIResponse<BudgetMonth[]> => {
    return response.dataType === "BudgetMonths";
  },
  is: (value: unknown): value is BudgetMonth => {
    return typeof value === "object" && value !== null;
  },
  load: async (): Promise<BudgetMonth> => {
    return IndexedDB.get("BudgetMonth").then(async (data) => {
      if (BudgetMonthState.is(data)) {
        return Clone(data);
      }

      return BudgetMonthState.new();
    });
  },
  new: newBudgetMonth,
  read: async (authHouseholdID: NullUUID): Promise<void | Err> => {
    return API.read(
      `/api/v1/budget/months/${authHouseholdID}/${BudgetMonthState.yearMonth.toNumber()}`,
      {},
    ).then(async (response) => {
      if (IsErr(response)) {
        return response;
      }

      if (BudgetMonthState.containsResponse(response)) {
        response.dataValue[0].budgetMonthCategories =
          BudgetMonthCategoryState.groupingSort(response.dataValue[0]);

        for (const category of response.dataValue[0].budgetMonthCategories) {
          if (
            category.budgetCategory.grouping === "" ||
            BudgetMonthState.groupings.includes(
              category.budgetCategory.grouping,
            )
          ) {
            continue;
          }
          BudgetMonthState.groupings.push(category.budgetCategory.grouping);
        }

        BudgetMonthState.data(response.dataValue[0]);

        m.redraw();
        if (
          BudgetMonthState.data().yearMonth ===
          Timestamp.now().toCivilDate().toYearMonth().toNumber()
        ) {
          return BudgetMonthState.set(BudgetMonthState.data());
        }
      }
    });
  },
  set: async (b: BudgetMonth): Promise<void | Err> => {
    return IndexedDB.set("BudgetMonth", b);
  },
  yearMonth: CivilDate.now().toYearMonth(),
};
