import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import type { CookRecipe } from "./CookRecipe";
import { CookRecipeState } from "./CookRecipe";
import { InventoryItemState } from "./InventoryItem";

describe("CookRecipeState", () => {
  test("data", () => {
    CookRecipeState.data(seed.cookRecipes);
    CookRecipeState.data([]);
  });

  test("getInventoryIngredients", () => {
    InventoryItemState.data([
      {
        ...InventoryItemState.new(),
        ...{
          name: "Arbol chiles",
          quantity: 1,
          shortID: "1",
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          name: "Cumin",
          quantity: 0,
          shortID: "2",
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          name: "Garlic",
          quantity: 10,
          shortID: "3",
        },
      },
      {
        ...InventoryItemState.new(),
        ...{
          name: "Oregano",
          quantity: 1,
          shortID: "4",
        },
      },
    ]);

    expect(
      CookRecipeState.getInventoryIngredients(`
# Arbol chiles sauce
4 dried chiles de arbol or Arbol Chiles
2 fresh red chiles, stems removed
4 garlic cloves, peeled
1 tbsp cumin seed
1 tsp dried oregano, Mexican variety is best
1 tsp. salt, or adjust to taste
1 tbsp sweet pimenton or paprika, for extra color
`),
    ).toBe(`
# Arbol chiles sauce
4 dried chiles de arbol or Arbol Chiles #inventoryitem/1?icon
2 fresh red chiles, stems removed
4 garlic cloves, peeled #inventoryitem/3?icon
1 tbsp cumin seed
1 tsp dried oregano, Mexican variety is best #inventoryitem/4?icon
1 tsp. salt, or adjust to taste
1 tbsp sweet pimenton or paprika, for extra color
`);
  });

  test("getTaggable", () => {
    const data: CookRecipe[] = [
      {
        ...CookRecipeState.new(),
        ...{
          id: "1",
          name: "1",
          tags: ["a", "b"],
        },
      },
      {
        ...CookRecipeState.new(),
        ...{
          id: "2",
          name: "2",
          tags: ["b", "c"],
        },
      },
      {
        ...CookRecipeState.new(),
        ...{
          deleted: Timestamp.now().toString(),
          id: "3",
          name: "3",
          tags: ["c", "a"],
        },
      },
    ];

    CookRecipeState.data(data);

    expect(CookRecipeState.tags()).toStrictEqual([
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

  test("importURL", async () => {
    testing.mocks.responses = [
      {
        dataType: "CookRecipe",
        dataValue: [CookRecipeState.new()],
      },
    ];

    await CookRecipeState.importURL("https://homechart.app", "1");

    testing.requests([
      {
        body: {
          authHouseholdID: "1",
          url: "https://homechart.app",
        },
        method: "POST",
        path: "/api/v1/import/recipe",
      },
    ]);
  });

  test("scaleIngredients", () => {
    const input = `## Recipe begins
1 16 oz can black beans
2 1/2 cups water

For the sauce:
1/16 teaspoon paprika
(1 tsp + 1/2 tsp) salt
2 tomatoes
4 tbsp + 1 tsp cumin`;
    const output = `## Recipe begins
4 16 oz can black beans
10 cups water

For the sauce:
1/4 teaspoon paprika
(4 tsp + 2 tsp) salt
8 tomatoes
16 tbsp + 4 tsp cumin`;
    expect(CookRecipeState.scaleIngredients(input, "4")).toBe(output);
  });
});
