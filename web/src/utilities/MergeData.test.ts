import { Sort } from "@lib/utilities/Sort";

import { DataArrayManager } from "../states/DataArray";
import { DataTypeEnum } from "../types/DataType";
import { MergeData } from "./MergeData";

const mergeClass = new DataArrayManager<Data>(
  "/api/v1/models",
  "id",
  false,
  DataTypeEnum.Data,
);

describe("MergeData", () => {
  test("no existing objects", async () => {
    const newData: Data[] = [
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "3",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "5",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "4",
          updated: "4",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "3",
          updated: "2",
        },
      },
    ];
    const want: Data[] = [
      newData[0],
      newData[2],
      newData[4],
      newData[3],
      newData[1],
    ];

    let got = await MergeData(mergeClass.data(), mergeClass.path, newData);
    Sort(got.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });
    expect(got.data).toStrictEqual(want);
    expect(got.changed).toBeTruthy();

    got = await MergeData(mergeClass.data(), mergeClass.path, newData[0]);
    Sort(got.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });
    expect(got.data).toStrictEqual([newData[0]]);
    expect(got.changed).toBeTruthy();
  });

  test("existing objects", async () => {
    mergeClass.data([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "0",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "2",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "3",
        },
      },
    ]);
    const newData: Data[] = [
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "2",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "4",
          updated: "4",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "3",
          updated: "3",
        },
      },
    ];
    const ids: APIResponseDataID[] = [
      {
        id: "1",
        updated: "1",
      },
      {
        id: "2",
        updated: "2",
      },
      {
        id: "3",
        updated: "3",
      },
      {
        id: "4",
        updated: "4",
      },
      {
        id: "5",
        updated: "5",
      },
    ];

    const readData = {
      ...mergeClass.new(),
      ...{
        id: "5",
        updated: "5",
      },
    };

    testing.mocks.responses = [
      {
        dataType: "Model",
        dataValue: [readData],
      },
    ];

    const want: Data[] = [
      newData[0],
      newData[1],
      newData[3],
      newData[2],
      readData,
    ];

    let got = await MergeData(mergeClass.data(), mergeClass.path, newData, ids);
    Sort(got.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });
    expect(got.data).toStrictEqual(want);
    expect(got.changed).toBeTruthy();

    mergeClass.data(want);

    got = await MergeData(
      mergeClass.data(),
      mergeClass.path,
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "2",
        },
      },
      ids,
    );
    Sort(got.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });

    expect(got.data).toStrictEqual([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "2",
        },
      },
      newData[1],
      newData[3],
      newData[2],
      readData,
    ]);
    expect(got.changed).toBeTruthy();
  });

  test("deletes only", async () => {
    mergeClass.data([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "2",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "5",
        },
      },
    ]);

    const newData: Data[] = [];
    const ids: APIResponseDataID[] = [
      {
        id: "1",
        updated: "1",
      },
      {
        id: "5",
        updated: "5",
      },
    ];

    const want: Data[] = [mergeClass.data()[0], mergeClass.data()[2]];

    const got = await MergeData(
      mergeClass.data(),
      mergeClass.path,
      newData,
      ids,
    );
    Sort(got.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });
    expect(got.data).toStrictEqual(want);
    expect(got.changed).toBeTruthy();
  });

  test("no changes", async () => {
    mergeClass.data([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "2",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "5",
        },
      },
    ]);
    const newData: Data[] = [];
    const ids: APIResponseDataID[] = [
      {
        id: "1",
        updated: "1",
      },
      {
        id: "2",
        updated: "2",
      },
      {
        id: "5",
        updated: "5",
      },
    ];
    const output = await MergeData(
      mergeClass.data(),
      mergeClass.path,
      newData,
      ids,
    );
    Sort(output.data, {
      invert: mergeClass.sortInvert,
      property: mergeClass.sortField,
    });
    expect(output.data).toStrictEqual(mergeClass.data());
    expect(output.changed).toBeFalsy();
  });

  test("new ids", async () => {
    mergeClass.data([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "2",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "5",
        },
      },
    ]);
    const newData: Data[] = [];
    const ids: APIResponseDataID[] = [
      {
        id: "1",
        updated: "1",
      },
      {
        id: "2",
        updated: "2",
      },
      {
        id: "3",
        updated: "3",
      },
      {
        id: "5",
        updated: "5",
      },
    ];
    const readData = {
      ...mergeClass.new(),
      ...{
        id: "3",
        test: "TEST3",
        updated: "3",
      },
    };

    testing.mocks.responses = [
      {
        dataType: "Model",
        dataValue: [readData],
      },
    ];

    const want: Data[] = [
      mergeClass.data()[0],
      mergeClass.data()[1],
      mergeClass.data()[2],
      readData,
    ];

    const got = await MergeData(
      mergeClass.data(),
      mergeClass.path,
      newData,
      ids,
    );

    expect(got.data).toStrictEqual(want);
    expect(got.changed).toBeTruthy();
  });
  test("full sync", async () => {
    mergeClass.data([
      {
        ...mergeClass.new(),
        ...{
          id: "1",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "2",
          updated: "1",
        },
      },
      {
        ...mergeClass.new(),
        ...{
          id: "5",
          updated: "1",
        },
      },
    ]);
    const newData: Data[] = [];
    const ids: APIResponseDataID[] = Array.from(Array(10).keys()).map((i) => {
      return {
        id: `${i + 1}`,
        updated: "2",
      };
    });
    const readData = Array.from(Array(10).keys()).map((i) => {
      return {
        ...mergeClass.new(),
        ...{
          id: `${i + 1}`,
          updated: "2",
        },
      };
    });

    testing.mocks.responses = [
      {
        dataType: "Models",
        dataValue: readData,
      },
    ];

    const got = await MergeData(
      mergeClass.data(),
      mergeClass.path,
      newData,
      ids,
    );

    expect(got.data).toStrictEqual(readData);
    expect(got.changed).toBeTruthy();
  });
});
