import seed from "../jest/seed";
import { HealthItemState } from "./HealthItem";

describe("HealthItemState", () => {
  test("data", () => {
    HealthItemState.data(seed.healthItems);
    HealthItemState.data([]);
  });

  test("findAuthAccountID", () => {
    const data = [
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          output: false,
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          output: true,
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          output: true,
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "2",
          output: false,
        },
      },
    ];

    HealthItemState.data(data);

    expect(HealthItemState.findAuthAccountID("1")).toHaveLength(3);
    expect(HealthItemState.findAuthAccountID("1", false)).toHaveLength(1);
    expect(HealthItemState.findAuthAccountID("1", true)).toHaveLength(2);
  });

  test("findAuthAccountIDName", () => {
    const data = [
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          name: "a",
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          name: "b",
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          name: "c",
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "2",
          name: "a",
        },
      },
    ];

    HealthItemState.data(data);

    expect(HealthItemState.findAuthAccountIDName("1", "a")).toStrictEqual(
      data[0],
    );
    expect(HealthItemState.findAuthAccountIDName("2", "a")).toStrictEqual(
      data[3],
    );
  });

  test("init", async () => {
    testing.mocks.responses = [{}];

    await HealthItemState.init("1");

    testing.requests([
      {
        method: "PUT",
        path: "/api/v1/health/items?authAccountID=1",
      },
    ]);
  });
});
