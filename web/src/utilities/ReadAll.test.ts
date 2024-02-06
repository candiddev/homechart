import type { Err } from "@lib/services/Log";
import { Timestamp } from "@lib/types/Timestamp";

import { IndexedDB } from "../services/IndexedDB";
import type { ReadAllArguments, ReadAllResponse } from "./ReadAll";
import { ReadAll } from "./ReadAll";

const newData: Data = {
  id: null,
  name: "",
  parentID: null,
  shortID: "0",
  tags: [] as string[],
  updated: null,
};

const now = Timestamp.now();

const datas = [
  {
    ...newData,
    ...{
      id: "1",
      updated: now.toString(),
    },
  },
  {
    ...newData,
    ...{
      id: "2",
      updated: now.toString(),
    },
  },
  {
    ...newData,
    ...{
      id: "3",
      updated: now.toString(),
    },
  },
];

const hash = "123";

const input = {
  data: [],
  hash: "",
  newObj: newData,
  path: "/api/v1/datas",
  sortField: "id",
  sortInvert: false,
  typeArray: "Datas",
};

beforeEach(async () => {
  await IndexedDB.set("Datas", datas);
  await IndexedDB.set("Datas_hash", hash);
});

test.each([
  [
    "offline",
    [
      {
        status: 0,
      },
    ],
    {
      ...input,
    },
    {
      data: datas,
      hash: hash,
      offline: true,
      typeArray: "Datas",
    },
    [
      {
        hash: hash,
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
    ],
  ],
  [
    "no change",
    [
      {
        status: 204,
      },
    ],
    {
      ...input,
    },
    {
      data: datas,
      hash: hash,
      offline: false,
      typeArray: "Datas",
    },
    [
      {
        hash: hash,
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
    ],
  ],
  [
    "wrong type",
    [
      {
        dataType: "datas",
        dataValue: [
          {
            id: "id?",
          },
        ],
      },
    ],
    {
      ...input,
    },
    {
      hash: hash,
      offline: false,
      typeArray: "Datas",
    },
    [
      {
        hash: hash,
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
    ],
  ],
  [
    "new data",
    [
      {
        dataType: "Datas",
        dataValue: [...datas],
      },
    ],
    {
      ...input,
      ...{
        data: [
          {
            ...newData,
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
        ],
        hash: "456",
      },
    },
    {
      data: datas,
      hash: "456",
      offline: false,
      typeArray: "Datas",
    },
    [
      {
        hash: "456",
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
    ],
  ],
  [
    "merge data",
    [
      {
        dataIDs: [
          {
            ...newData,
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
          {
            ...newData,
            ...{
              id: "2",
              updated: now.toString(),
            },
          },
          {
            ...newData,
            ...{
              id: "3",
              updated: now.toString(),
            },
          },
        ],
        dataType: "Datas",
        dataValue: [
          {
            ...newData,
            ...{
              id: "3",
              updated: now.toString(),
            },
          },
        ],
      },
      {
        dataType: "Data",
        dataValue: [
          {
            ...newData,
            ...{
              id: "2",
              updated: now.toString(),
            },
          },
        ],
      },
      {
        dataType: "Data",
        dataValue: [
          {
            ...newData,
            ...{
              id: "3",
              updated: now.toString(),
            },
          },
        ],
      },
    ],
    {
      ...input,
      ...{
        data: [
          {
            ...newData,
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
        ],
        hash: "456",
      },
    },
    {
      data: datas,
      hash: "456",
      offline: false,
      typeArray: "Datas",
    },
    [
      {
        hash: "456",
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
      {
        method: "GET",
        path: "/api/v1/datas/2",
      },
    ],
  ],
  [
    "restricted",
    [
      {
        message: "Restricted",
        status: 403,
      },
    ],
    {
      ...input,
      ...{
        data: [
          {
            ...newData,
            ...{
              id: "1",
              updated: now.toString(),
            },
          },
        ],
        hash: "456",
      },
    },
    {
      error: "API error",
      message: "Restricted",
    },
    [
      {
        hash: "456",
        method: "GET",
        path: "/api/v1/datas",
        updated: now.toString(),
      },
    ],
  ],
])(
  "ReadAll: %s",
  async (
    _name: string,
    responses: XHRResponse[],
    input: ReadAllArguments<Data>,
    output: ReadAllResponse<Data> | Err,
    requests: XHRRequest[],
  ) => {
    testing.mocks.responses = responses;

    expect(await ReadAll(input)).toStrictEqual(output);

    testing.requests(requests);
  },
);
