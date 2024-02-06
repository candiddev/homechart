import { Timestamp } from "@lib/types/Timestamp";

import { TableNotifyOperationEnum } from "../types/TableNotify";
import { ChangeState } from "./Change";

describe("ChangeState", () => {
  test("table", () => {
    const now = Timestamp.now();
    const previous = Timestamp.now();
    previous.addMinutes(10);

    ChangeState.data([
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "1",
          id: "1",
          name: "a",
          operation: TableNotifyOperationEnum.Create,
          tableName: "health_item",
          updated: now.toString(),
        },
      },
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "1",
          id: "2",
          name: "b",
          operation: TableNotifyOperationEnum.Create,
          tableName: "health_item",
          updated: now.toString(),
        },
      },
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "1",
          id: "3",
          name: "c",
          operation: TableNotifyOperationEnum.Create,
          tableName: "health_item",
          updated: now.toString(),
        },
      },
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "2",
          id: "4",
          name: "c",
          operation: TableNotifyOperationEnum.Create,
          tableName: "health_item",
          updated: now.toString(),
        },
      },
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "1",
          id: "5",
          name: "a",
          operation: TableNotifyOperationEnum.Delete,
          tableName: "health_item",
          updated: now.toString(),
        },
      },
      {
        ...ChangeState.new(),
        ...{
          authAccountID: "1",
          id: "6",
          name: "a",
          operation: TableNotifyOperationEnum.Update,
          tableName: "shop_item",
          updated: previous.toString(),
        },
      },
    ]);

    expect(ChangeState.table()).toStrictEqual([
      {
        authAccountID: "1",
        change: "added 3 [Health > Items](/health/items)",
        id: "1",
        names: ["a", "b", "c"],
        updated: now.toString(),
      },
      {
        authAccountID: "2",
        change: "added a [Health > Item](/health/items)",
        id: "4",
        names: ["c"],
        updated: now.toString(),
      },
      {
        authAccountID: "1",
        change: "deleted a [Health > Item](/health/items)",
        id: "5",
        names: ["a"],
        updated: now.toString(),
      },
      {
        authAccountID: "1",
        change: "updated a [Shop > Item](/shop/items)",
        id: "6",
        names: ["a"],
        updated: previous.toString(),
      },
    ]);
  });
});
