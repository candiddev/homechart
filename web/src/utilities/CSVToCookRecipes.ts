import { CSV } from "@lib/utilities/CSV";

import { CookRecipeState } from "../states/CookRecipe";

/* eslint-disable jsdoc/require-jsdoc */
export interface CookRecipeFields {
  [key: string]: string;
  "Cook Time": string;
  Complexity: string;
  Directions: string;
  Ingredients: string;
  Name: string;
  "Prep Time": string;
  Rating: string;
  Servings: string;
  Source: string;
  Tags: string;
}

export async function CSVToCookRecipes(
  input: string,
  fields: CookRecipeFields,
): Promise<void> {
  const data = await CSV.import(input);

  if (data !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const value of data.data as any[]) {
      const recipe = {
        ...CookRecipeState.new(),
        ...{
          directions: value[fields.Directions],
          ingredients: value[fields.Ingredients],
          name: value[fields.Name],
          servings: value[fields.Servings],
          source: value[fields.Source],
          tags: value[fields.Tags].split(","),
        },
      };

      if (fields["Cook Time"] !== "") {
        const cookTime = parseInt(value[fields["Cook Time"]]);

        if (!isNaN(cookTime)) {
          recipe.timeCook = cookTime;
        }
      }

      if (fields.Complexity !== "") {
        const complexity = parseInt(value[fields.Complexity]);

        if (!isNaN(complexity)) {
          recipe.complexity = complexity;
        }
      }

      if (fields["Prep Time"] !== "") {
        const prepTime = parseInt(value[fields["Prep Time"]]);

        if (!isNaN(prepTime)) {
          recipe.timePrep = prepTime;
        }
      }

      if (fields.Rating !== "") {
        const rating = parseInt(value[fields.Rating]);

        if (!isNaN(rating)) {
          recipe.rating = rating;
        }
      }

      await CookRecipeState.create(recipe);
    }
  }
}
