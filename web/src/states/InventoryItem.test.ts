import seed from "../jest/seed";
import { apiEndpoint } from "../services/API";
import { InventoryItemState } from "./InventoryItem";

describe("InventoryItemState", () => {
  test("data", () => {
    InventoryItemState.data(seed.inventoryItems);
    InventoryItemState.data([]);
  });

  test("findPropertyValues", () => {
    const data = [
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            a: "2",
            c: "1",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            a: "1",
            b: "2",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            b: "1",
            c: "2",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {},
        },
      },
    ];

    InventoryItemState.data(data);

    expect(InventoryItemState.findPropertyValues("a")).toStrictEqual([
      "1",
      "2",
    ]);
  });

  test("getLink", () => {
    apiEndpoint().hostname = "http://example.com";

    expect(InventoryItemState.getLink("1")).toBe(
      "http://example.com/inventory/all?id=1",
    );
  });

  test("getProperties", () => {
    const data = [
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            a: "2",
            c: "1",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            a: "1",
            b: "2",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {
            b: "1",
            c: "2",
          },
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          properties: {},
        },
      },
    ];

    InventoryItemState.data(data);

    expect(InventoryItemState.properties()).toStrictEqual([
      "Location",
      "a",
      "b",
      "c",
    ]);
  });
});
