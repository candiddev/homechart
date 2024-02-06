import seed from "../jest/seed";
import { apiEndpoint } from "../services/API";
import { InventoryCollectionState } from "./InventoryCollection";

describe("InventoryCollectionState", () => {
  test("data", () => {
    InventoryCollectionState.data(seed.inventoryCollections);
    InventoryCollectionState.data([]);
  });

  test("groupingNames", () => {
    InventoryCollectionState.data(seed.inventoryCollections);
    expect(InventoryCollectionState.groupingNames()).toStrictEqual([
      "Filters",
      "Storage",
    ]);
  });

  test("getLink", () => {
    apiEndpoint().hostname = "http://example.com";

    expect(InventoryCollectionState.getLink("1")).toBe(
      "http://example.com/inventory/1",
    );
  });

  test("toView", () => {
    expect(
      InventoryCollectionState.toView({
        ...InventoryCollectionState.new(),
        ...{
          icon: "test",
          id: "1",
          name: "Test",
        },
      }),
    ).toStrictEqual({
      icon: "test",
      id: "1",
      link: "/inventory/1",
      name: "Test",
    });
  });
});
