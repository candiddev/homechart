import seed from "../jest/seed";
import { CookMealTimeState } from "./CookMealTime";

describe("CookMealTimeState", () => {
  test("data", () => {
    CookMealTimeState.data(seed.cookMealTimes);
    CookMealTimeState.data([]);
  });
  test("getNames", () => {
    CookMealTimeState.data([
      {
        ...CookMealTimeState.new(),
        ...{
          name: "1",
          time: "03:00",
        },
      },
      {
        ...CookMealTimeState.new(),
        ...{
          name: "2",
          time: "02:00",
        },
      },
      {
        ...CookMealTimeState.new(),
        ...{
          name: "3",
          time: "01:00",
        },
      },
    ]);
    expect(CookMealTimeState.names()).toStrictEqual(["3", "2", "1"]);

    expect(CookMealTimeState.data()[0].name).toBe("1");
  });
});
