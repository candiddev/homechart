package parse

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
)

func TestJSONLDRecipeToCookRecipe(t *testing.T) {
	tests := []JSONLDRecipe{
		jsonLDRecipe1,
		jsonLDRecipe2,
	}

	for i := range tests {
		t.Run(fmt.Sprint(i), func(t *testing.T) {
			c := tests[i].ToCookRecipe(ctx)

			assert.Equal(t, c.Image != "", true)

			c.Image = ""
			assert.Equal(t, c, &models.CookRecipe{
				Directions: `Preheat oven to 425 degrees F (220 degrees C).
Heat olive oil and garlic in a small saucepan over low heat until warmed, 1 to 2 minutes. Transfer garlic and oil to a shallow bowl.
Bake in the preheated oven until no longer pink and juices run clear, 30 to 35 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).
`,
				Ingredients: `¼ cup olive oil
2 cloves garlic, crushed
4 skinless, boneless chicken breast halves`,
				Name:     "Tasty Chicken",
				Servings: "4 servings",
				Source:   "https://homechart.app/somerecipe",
				Tags: []string{
					"meatandpoultry",
					"chicken",
					"chickenbreasts",
				},
				TimeCook: 35,
				TimePrep: 20,
			})
		})
	}
}
