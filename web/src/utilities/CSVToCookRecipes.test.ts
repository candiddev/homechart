import { CookRecipeState } from "../states/CookRecipe";
import { CSVToCookRecipes } from "./CSVToCookRecipes";

test("CSVToCookRecipes", async () => {
  const outputs = [
    {
      ...CookRecipeState.new(),
      ...{
        complexity: 1,
        directions: "a",
        ingredients: "b",
        name: "1",
        rating: 1,
        servings: "c",
        source: "d",
        tags: ["a", "b", "c"],
        timeCook: 15,
        timePrep: 15,
      },
    },
    {
      ...CookRecipeState.new(),
      ...{
        complexity: 2,
        directions: "a",
        ingredients: "b",
        name: "2",
        rating: 2,
        servings: "c",
        source: "d",
        tags: ["c"],
        timeCook: 15,
        timePrep: 15,
      },
    },
  ];

  const input = `
Recipe Name,Time to Cook,Time to Prep,Complexity,Directions,Ingredients,Rank,Tags,Number of Servings,Source
${outputs
  .map((output) => {
    return `${output.name},${output.timeCook},${output.timePrep},${output.complexity},${output.directions},${output.ingredients},${output.rating},"${output.tags.join(",")}",${output.servings},${output.source}`;
  })
  .join("\n")}
`;

  testing.mocks.responses = [
    {
      dataType: "CookRecipe",
      dataValue: [CookRecipeState.new()],
    },
    {
      dataType: "CookRecipe",
      dataValue: [CookRecipeState.new()],
    },
  ];

  await CSVToCookRecipes(input, {
    Complexity: "Complexity",
    "Cook Time": "Time to Cook",
    Directions: "Directions",
    Ingredients: "Ingredients",
    Name: "Recipe Name",
    "Prep Time": "Time to Prep",
    Rating: "Rank",
    Servings: "Number of Servings",
    Source: "Source",
    Tags: "Tags",
  });

  testing.requests([
    {
      body: outputs[0],
      method: "POST",
      path: "/api/v1/cook/recipes",
    },
    {
      body: outputs[1],
      method: "POST",
      path: "/api/v1/cook/recipes",
    },
  ]);
});
