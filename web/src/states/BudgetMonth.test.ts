import { YearMonth } from "@lib/types/YearMonth";
import { Clone } from "@lib/utilities/Clone";

import seed from "../jest/seed";
import { BudgetMonthState } from "./BudgetMonth";
import { BudgetMonthCategoryState } from "./BudgetMonthCategory";

describe("BudgetMonthState", () => {
  test("load/set", async () => {
    await BudgetMonthState.set(seed.budgetMonths[0]);

    expect(await BudgetMonthState.load()).toStrictEqual(seed.budgetMonths[0]);
  });

  test("read", async () => {
    testing.mocks.responses = [
      {
        dataType: "BudgetMonth",
        dataValue: [seed.budgetMonths[0]],
      },
    ];

    BudgetMonthState.yearMonth = YearMonth.fromNumber(
      seed.budgetMonths[0].yearMonth,
    );

    await BudgetMonthState.read(seed.authHouseholds[0].id);

    const bm = Clone(seed.budgetMonths[0]);

    BudgetMonthCategoryState.groupingSort(bm);

    expect(BudgetMonthState.data()).toStrictEqual({
      ...seed.budgetMonths[0],
      ...{
        budgetMonthCategories: BudgetMonthState.data().budgetMonthCategories,
        targetAmount: (bm as any).targetAmount,
      },
    });

    testing.requests([
      {
        method: "GET",
        path: `/api/v1/budget/months/${seed.authHouseholds[0].id}/${seed.budgetMonths[0].yearMonth}`,
      },
    ]);
  });
});
