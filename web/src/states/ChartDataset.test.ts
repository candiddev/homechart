import { YearMonth } from "@lib/types/YearMonth";

import seed from "../jest/seed";
import { ChartDatasetState, ChartDatasetTypesEnum } from "./ChartDataset";

describe("ChartDatasetState", () => {
  test("read", async () => {
    testing.mocks.responses = [
      {
        dataType: "ChartDatasets",
        dataValue: [
          {
            name: "test",
            values: [],
          },
        ],
      },
    ];
    expect(
      await ChartDatasetState.read(
        seed.authHouseholds[0].id,
        {
          from: YearMonth.fromNumber(202101),
          to: YearMonth.fromNumber(202112),
        },
        ChartDatasetTypesEnum.BudgetCategory,
      ),
    ).toStrictEqual([
      {
        name: "test",
        values: [],
      },
    ]);

    testing.requests([
      {
        method: "GET",
        path: `/api/v1/charts/datasets/${seed.authHouseholds[0].id}/0?from=202101&to=202112`,
      },
    ]);
  });
});
