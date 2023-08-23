package controllers

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestImportCookRecipe(t *testing.T) {
	logger.UseTestLogger(t)

	h.Router.Get("/recipe", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "text/html")
		fmt.Fprint(w, `
<html>
	<head>
		<script type="application/ld+json">
{
	"@graph": [
		{
			"@type": "Recipe",
			"mainEntityOfPage": "https://homechart.app/somerecipe",
			"name": "Plain Chicken",
			"datePublished": "2018-04-13T03:13:06.000Z",
			"description": "Really good!",
			"prepTime": "P0DT0H20M",
			"cookTime": "P0DT0H35M",
			"totalTime": "P0DT0H55M",
			"recipeYield": "4 servings",
			"recipeIngredient": [
				"4 skinless, boneless chicken breast halves"
			],
			"recipeInstructions": [
				{
					"@type": "HowToStep",
					"text": "Cook chicken"
				}
			],
			"recipeCategory": [
				"Chicken"
			]
		},
		{
			"@type": "Text",
			"name": "some text"
		}
	]
}
		</script>
	</head>
</html>`)
	})

	var c models.CookRecipes

	r := request{
		data: importCookRecipe{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			URL:             ts.URL + "/recipe",
		},
		method:       "POST",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/import/recipe",
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Ingredients, "4 skinless, boneless chicken breast halves")

	models.Delete(ctx, &c[0], models.DeleteOpts{})
}
