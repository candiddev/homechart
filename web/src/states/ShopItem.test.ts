import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { ShopItemState } from "./ShopItem";

describe("ShopItemState", () => {
  test("data", () => {
    ShopItemState.data(seed.shopItems);
    ShopItemState.data([]);
  });

  test("costItems", () => {
    expect(
      ShopItemState.costItems([
        {
          ...ShopItemState.new(),
          ...{
            price: 100,
          },
        },
        {
          ...ShopItemState.new(),
          ...{
            price: 200,
          },
        },
        {
          ...ShopItemState.new(),
          ...{
            price: 300,
          },
        },
      ]),
    ).toBe(600);
  });

  test("countItems", () => {
    const tomorrow = Timestamp.now();
    tomorrow.addDays(1);

    ShopItemState.data([
      ...seed.shopItems,
      {
        ...ShopItemState.new(),
        ...{
          id: "1",
          name: "test",
          nextDate: tomorrow.toCivilDate().toJSON(),
        },
      },
    ]);

    expect(ShopItemState.countItems()).toBe(seed.shopItems.length - 2);

    expect(ShopItemState.countItems(seed.budgetPayees[1].id)).toBe(3);
  });

  test("findPlanProjectID", () => {
    const data = [
      {
        ...ShopItemState.new(),
        ...{
          id: "1",
        },
      },
      {
        ...ShopItemState.new(),
        ...{
          id: "2",
          planProjectID: "1",
        },
      },
      {
        ...ShopItemState.new(),
        ...{
          id: "3",
          planProjectID: "2",
        },
      },
    ];

    ShopItemState.data(data);

    expect(ShopItemState.findPlanProjectID("2")).toStrictEqual([data[2]]);

    expect(ShopItemState.findPlanProjectID(null)).toStrictEqual([]);
  });

  test("getItems/getStaples", () => {
    const today = Timestamp.now();
    const tomorrow = Timestamp.now();
    tomorrow.addDays(1);

    const data = [
      {
        ...ShopItemState.new(),
        ...{
          name: "a",
        },
      },
      {
        ...ShopItemState.new(),
        ...{
          name: "b",
          nextDate: today.toCivilDate().toJSON(),
        },
      },
      {
        ...ShopItemState.new(),
        ...{
          name: "c",
          nextDate: tomorrow.toCivilDate().toJSON(),
        },
      },
      {
        ...ShopItemState.new(),
        ...{
          name: "d",
          shopListID: "1",
        },
      },
    ];

    ShopItemState.data(data);

    expect(ShopItemState.getStaples()()).toStrictEqual([data[1], data[2]]);
  });
});
