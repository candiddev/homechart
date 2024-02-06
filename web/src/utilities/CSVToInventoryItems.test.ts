import { InventoryItemState } from "../states/InventoryItem";
import { CSVToInventoryItems } from "./CSVToInventoryItems";

test("CSVToInventoryItems", async () => {
  const outputs = [
    {
      ...InventoryItemState.new(),
      ...{
        name: "1",
        properties: {
          a: "a",
          b: "b",
          c: "",
        },
        quantity: 2,
        upc: "abc",
      },
    },
    {
      ...InventoryItemState.new(),
      ...{
        name: "2",
        properties: {
          a: "",
          b: "b",
          c: "c",
        },
        quantity: 3,
        upc: "def",
      },
    },
  ];

  const input = `
Item Name,Number Of,UPC ID,a,b,c
1,2,abc,a,b,
2,3,def,,b,c
`;

  testing.mocks.responses = [
    {
      dataType: "InventoryItem",
      dataValue: [InventoryItemState.new()],
    },
    {
      dataType: "InventoryItem",
      dataValue: [InventoryItemState.new()],
    },
  ];

  await CSVToInventoryItems(input, {
    Name: "Item Name",
    Quantity: "Number Of",
    UPC: "UPC ID",
    a: "a",
    b: "b",
    c: "c",
  });

  testing.requests([
    {
      body: outputs[0],
      method: "POST",
      path: "/api/v1/inventory/items",
    },
    {
      body: outputs[1],
      method: "POST",
      path: "/api/v1/inventory/items",
    },
  ]);
});
