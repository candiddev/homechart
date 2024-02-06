import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import { DataTypeEnum } from "../types/DataType";
import { TableNotifyOperationEnum } from "../types/TableNotify";
import { DataManager } from "./Data";

describe("DataManager", () => {
  const now = Timestamp.now();

  beforeEach(() => {
    testing.mocks.responses = [
      {
        dataIDs: [
          {
            id: "1",
            updated: now.toString(),
          },
        ],
        dataTotal: 1,
        dataType: "Data",
        dataValue: [
          {
            id: "1",
            updated: now.toString(),
          },
        ],
      },
    ];
  });

  test("create", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
    });

    await data.create();

    testing.requests([
      {
        body: {
          id: "1",
        },
        method: "POST",
        path: "/api/v1/data",
      },
    ]);

    expect(data.updated!.toString()).toBe(now.toString());
  });

  test("delete", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
      updated: now.toString(),
    });

    await data.delete();

    testing.requests([
      {
        method: "DELETE",
        path: "/api/v1/data/1",
      },
    ]);
  });

  test("load", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
      updated: now.toString(),
    });

    await data.set();

    data.data({
      ...data.data(),
      ...{
        id: null,
      },
    });

    await data.load();

    expect(data.data().id).toBe("1");
  });

  test("read", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
      updated: "1",
    });

    await data.read();

    testing.requests([
      {
        method: "GET",
        path: "/api/v1/data/1",
        updated: "1",
      },
    ]);

    expect(data.updated!.toString()).toBe(now.toString());

    await data.read({
      id: "1",
      operation: TableNotifyOperationEnum.Update,
      table: "",
      updated: now.toString(),
    });

    testing.requests([]);

    expect(data.updated!.toString()).toBe(now.toString());

    // Offline
    data.path = "/this/should/fail0";
    testing.mocks.responses = [];

    await data.read();

    expect(AppState.isSessionOnline()).toBeFalsy();

    testing.mocks.requests = [];
  });

  test("reset", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
      updated: now.toString(),
    });

    data.reset();

    expect(data.data()).toStrictEqual(data.new());
  });

  test("update", async () => {
    testing.mocks.responses.push(testing.mocks.responses[0]);

    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
    });

    await data.update(data.data());

    testing.requests([
      {
        body: {
          id: "1",
        },
        method: "PUT",
        path: "/api/v1/data/1",
      },
    ]);

    expect(data.updated!.toString()).toBe(now.toString());

    await data.update({
      ...data.data(),
      ...{
        id: "2",
      },
    });

    testing.requests([
      {
        body: {
          id: "2",
          updated: data.data().updated,
        },
        method: "PUT",
        path: "/api/v1/data/2",
      },
    ]);

    expect(data.updated!.toString()).toBe(now.toString());
  });

  test("updated", async () => {
    const data = new DataManager<Data>("/api/v1/data", DataTypeEnum.Data, {
      id: "1",
      updated: now.toString(),
    });

    expect(data.updated!.toString()).toBe(now.toString());
  });
});
