import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import { DataTypeEnum } from "../types/DataType";
import { Alerts } from "../utilities/Alerts";
import type { ReadAllResponse } from "../utilities/ReadAll";
import { Controller } from "../worker";
import { WorkerAction } from "../worker/Handler";
import type { WorkerResponseReadAll } from "../worker/ReadAll";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

describe("DataArrayManager", () => {
  let data: DataArrayManager<Data>;

  beforeAll(async () => {
    Controller.init((res) => {
      if (res.action === WorkerAction.FilterSortChildren) {
        data.loading = 1;
        data.setNested((res.data as any).data);
      }

      const d =
        res.data as WorkerResponseReadAll["data"] as ReadAllResponse<any>;

      if (d.offline) {
        Alerts.offline();
      } else {
        Alerts.online();
      }

      if (d.data === undefined) {
        return;
      }

      data.set(d.data, d.hash);
    });
  });

  beforeEach(async () => {
    data = new DataArrayManager<Data>(
      "/api/v1/data",
      "id",
      false,
      DataTypeEnum.Data,
    );
  });

  const now = Timestamp.now();

  test("create", async () => {
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
            ...data.new(),
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
        ],
      },
    ];

    await data.create({
      id: "1",
      updated: null,
    });

    testing.requests([
      {
        body: {
          id: "1",
          updated: null,
        },
        method: "POST",
        path: "/api/v1/data",
      },
    ]);
  });

  test("delete", async () => {
    data.data([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
          updated: now.toString(),
        },
      },
    ]);

    testing.mocks.responses = [{}];

    await data.delete("1");

    testing.requests([
      {
        method: "DELETE",
        path: "/api/v1/data/1",
      },
    ]);
  });

  test("findBatch", () => {
    data.batch.push({
      ...data.new(),
      ...{
        id: "1",
        name: "a",
      },
    });

    expect(data.findBatch("1")).toStrictEqual(data.batch[0]);
    expect(data.findBatch("2")).toStrictEqual(data.new());
  });

  test("findName/getNames", async () => {
    data.data([
      {
        ...data.new(),
        ...{
          id: "1",
          name: "a",
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
          name: "b",
        },
      },
    ]);

    await testing.sleep(100);

    expect(data.findName("b")).toStrictEqual({
      ...data.new(),
      ...{
        id: "2",
        name: "b",
      },
    });

    expect(data.names()).toStrictEqual(["a", "b"]);
  });

  test("findShortID", () => {
    data.data([
      {
        ...data.new(),
        ...{
          authHouseholdID: "1",
          id: "1",
          shortID: "1",
        },
      },
      {
        ...data.new(),
        ...{
          authHouseholdID: "1",
          id: "2",
          shortID: "2",
        },
      },
    ]);

    AuthAccountState.data().primaryAuthHouseholdID = "1";

    expect(data.findShortID("2")).toStrictEqual({
      ...data.new(),
      ...{
        authHouseholdID: "1",
        id: "2",
        shortID: "2",
      },
    });
  });

  test("isLoaded", () => {
    data.loading = 1;
    process.env.NODE_ENV = "";
    expect(data.isLoaded()).toBeFalsy();
    data.loading = 0;
    expect(data.isLoaded()).toBeTruthy();
    process.env.NODE_ENV = "test";
  });

  test("read", async () => {
    const d = {
      ...data.new(),
      ...{
        id: "1",
        updated: now.toString(),
      },
    };

    testing.mocks.responses = [
      {
        status: 0,
      },
      {
        dataTotal: 1,
        dataType: "Data",
        dataValue: [d],
      },
      {
        dataTotal: 1,
        dataType: "Data",
        dataValue: [d],
      },
    ];

    expect(await data.read("1")).toBeUndefined();

    await testing.sleep(100);

    expect(AppState.isSessionOnline()).toBeFalsy();

    expect(await data.read("1")).toBeUndefined();

    await testing.sleep(200);

    testing.requests([
      {
        method: "GET",
        path: "/api/v1/data/1",
      },
      {
        method: "GET",
        path: "/api/v1/data/1",
      },
    ]);

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
    ]);

    expect(AppState.isSessionOnline()).toBeTruthy();

    expect(await data.read("1", undefined, true)).toStrictEqual(d);
  });

  test("readAll", async () => {
    testing.mocks.responses = [
      {
        dataType: "Datas",
        dataValue: [
          {
            ...data.new(),
            ...{
              id: "2",
              updated: now.toString(),
            },
          },
          {
            ...data.new(),
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
        ],
      },
      {
        dataHash: "1",
        dataIDs: [
          {
            id: "2",
            updated: now.toString(),
          },
          {
            id: "3",
            updated: now.toString(),
          },
          {
            id: "1",
            updated: now.toString(),
          },
        ],
        dataType: "Datas",
      },
      {
        dataType: "Datas",
        dataValue: [
          {
            ...data.new(),
            ...{
              id: "3",
              updated: now.toString(),
            },
          },
        ],
      },
      {
        status: 0,
      },
      {
        status: 403,
      },
    ];

    data.readAll();

    await testing.sleep(100);

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
          updated: now.toString(),
        },
      },
    ]);

    expect(data.refreshed).toBeTruthy();
    expect(data.loading).toBe(0);
  });

  test("readAllSync", async () => {
    testing.mocks.responses = [
      {
        dataType: "Datas",
        dataValue: [
          {
            ...data.new(),
            ...{
              id: "2",
              updated: now.toString(),
            },
          },
          {
            ...data.new(),
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
          {
            ...data.new(),
            ...{
              id: "3",
              updated: now.toString(),
            },
          },
        ],
      },
    ];

    expect(await data.readAllSync()).toBeUndefined();

    expect(data.data()).toHaveLength(3);
  });

  test("remove", async () => {
    data.data([
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
        },
      },
      {
        ...data.new(),
        ...{
          id: "3",
        },
      },
    ]);

    data.remove("2");
    data.remove("4");

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
      {
        ...data.new(),
        ...{
          id: "3",
        },
      },
    ]);

    testing.mocks.requests = [];
  });

  test("reset", async () => {
    data.data([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
    ]);
    data.refreshed = true;

    data.reset();

    expect(data.data().length).toBe(0);
    expect(data.refreshed).toBeFalsy();
  });

  test("set", async () => {
    data.data([
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
    ]);

    data.loading = 1;
    data.set({
      ...data.new(),
      ...{
        id: "2",
      },
    });

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
        },
      },
    ]);

    data.loading = 1;
    data.set({
      ...data.new(),
      ...{
        id: "1",
        updated: now.toString(),
      },
    });

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
        },
      },
    ]);

    data.loading = 1;
    data.set([
      {
        ...data.new(),
        ...{
          id: "2",
        },
      },
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
    ]);

    expect(data.data()).toStrictEqual([
      {
        ...data.new(),
        ...{
          id: "1",
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
        },
      },
    ]);
  });

  test("update", async () => {
    data.loading = 1;
    data.set([
      {
        ...data.new(),
        ...{
          id: "1",
          updated: now.toString(),
        },
      },
    ]),
      (testing.mocks.responses = [
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
              ...data.new(),
              ...{
                id: "1",
                updated: now.toString(),
                value: "something",
              },
            },
          ],
        },
      ]);

    AppState.data.layoutAppAlerts = [];
    await data.update({
      ...data.new(),
      ...{
        id: "1",
        updated: null,
      },
    });

    testing.requests([
      {
        body: {
          ...data.new(),
          ...{
            id: "1",
            updated: null,
          },
        },
        method: "PUT",
        path: "/api/v1/data/1",
      },
    ]);

    testing.mocks.responses.push({
      dataType: "Data",
      dataValue: [
        {
          ...data.new(),
          ...{
            id: "1",
            updated: now.toString(),
          },
        },
      ],
    });

    // Test undo
    await AppState.getLayoutAppAlerts()[0].actions![1].onclick();

    testing.requests([
      {
        body: {
          ...data.new(),
          ...{
            id: "1",
            updated: now.toString(),
          },
        },
        method: "PUT",
        path: "/api/v1/data/1",
      },
    ]);
  });
  test("getTagNames/findTag/setTags", () => {
    data.loading = 1;
    data.set([
      {
        ...data.new(),
        ...{
          id: "1",
          tags: ["a", "b"],
        },
      },
      {
        ...data.new(),
        ...{
          id: "2",
          tags: ["b", "c"],
        },
      },
    ]);

    expect(data.tagNames()).toStrictEqual(["a", "b", "c"]);

    expect(data.findTag("a")).toStrictEqual([data.data()[0]]);
    expect(data.findTag("b")).toStrictEqual([data.data()[0], data.data()[1]]);

    expect(data.tags()).toStrictEqual([
      {
        count: 1,
        name: "a",
      },
      {
        count: 2,
        name: "b",
      },
      {
        count: 1,
        name: "c",
      },
    ]);
  });
});
