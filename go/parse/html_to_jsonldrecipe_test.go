package parse

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

const htmlJSONLDRecipe1 = `
<html>
	<head>
		<title>A Recipe</title>
		<script type="application/ld+json">
		[
			{
				"@context": "http://schema.org",
				"@type": "Recipe",
				"mainEntityOfPage": "https://homechart.app/somerecipe",
				"name": "Tasty Chicken",
				"image": {
					"@type": "ImageObject",
					"url": "https://homechart.app/homechart.png",
					"width": null,
					"height": null,
					"caption": "Tasy Chicken"
				},
				"datePublished": "2018-04-13T03:13:06.000Z",
				"description": "Really good!",
				"prepTime": "P0DT0H20M",
				"cookTime": "P0DT0H35M",
				"totalTime": "P0DT0H55M",
				"recipeYield": "4 servings",
				"recipeIngredient": [
					"¼ cup olive oil",
					"2 cloves garlic, crushed",
					"4 skinless, boneless chicken breast halves"
				],
				"recipeInstructions": [
					{
						"@type": "HowToStep",
						"text": "Preheat oven to 425 degrees F (220 degrees C).\n"
					},
					{
						"@type": "HowToStep",
						"text": "Heat olive oil and garlic in a small saucepan over low heat until warmed, 1 to 2 minutes. Transfer garlic and oil to a shallow bowl.\n"
					},
					{
						"@type": "HowToStep",
						"text": "Bake in the preheated oven until no longer pink and juices run clear, 30 to 35 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).\n"
					}
				],
				"recipeCategory": [
					"Meat and Poultry",
					"Chicken",
					"Chicken Breasts"
				]
			},
			{
				"@type": "Text",
				"name": "some text"
			}
		]
		</script>
	</head>
	<body>
		<h1>Hello!</h1>
	</body>
</html
`

const htmlJSONLDRecipe2 = `
<html>
	<head>
		<title>A Recipe</title>
		<script type="application/ld+json">
		[
			{
				"@context": "http://schema.org",
				"@type": [
					"Page",
					"Recipe"
				],
				"mainEntityOfPage": {
					"@id": "https://homechart.app/somerecipe"
				},
				"name": "Tasty Chicken",
				"image": {
					"@type": "ImageObject",
					"url": "https://homechart.app/homechart.png",
					"width": null,
					"height": null,
					"caption": "Tasy Chicken"
				},
				"datePublished": "2018-04-13T03:13:06.000Z",
				"description": "Really good!",
				"prepTime": "P0DT0H20M",
				"cookTime": "P0DT0H35M",
				"totalTime": "P0DT0H55M",
				"recipeYield": [
					"4 servings"
				],
				"recipeIngredient": [
					"¼ cup olive oil",
					"2 cloves garlic, crushed",
					"4 skinless, boneless chicken breast halves"
				],
				"recipeInstructions": [
					{
						"@type": "HowToStep",
						"text": "Preheat oven to 425 degrees F (220 degrees C).\n"
					},
					{
						"@type": "HowToStep",
						"text": "Heat olive oil and garlic in a small saucepan over low heat until warmed, 1 to 2 minutes. Transfer garlic and oil to a shallow bowl.\n"
					},
					{
						"@type": "HowToStep",
						"text": "Bake in the preheated oven until no longer pink and juices run clear, 30 to 35 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).\n"
					}
				],
				"recipeCategory": [
					"Meat and Poultry",
					"Chicken",
					"Chicken Breasts"
				]
			},
			{
				"@type": "Text",
				"name": "some text"
			}
		]
		</script>
	</head>
	<body>
		<h1>Hello!</h1>
	</body>
</html
`

var jsonLDRecipe1 = JSONLDRecipe{
	CookTime:         "P0DT0H35M",
	ImageURL:         "https://homechart.app/homechart.png",
	MainEntityOfPage: "https://homechart.app/somerecipe",
	Name:             "Tasty Chicken",
	PrepTime:         "P0DT0H20M",
	RecipeCategory: []string{
		"Meat and Poultry",
		"Chicken",
		"Chicken Breasts",
	},
	RecipeYield: "4 servings",
	RecipeIngredient: []string{
		"¼ cup olive oil",
		"2 cloves garlic, crushed",
		"4 skinless, boneless chicken breast halves",
	},
	RecipeInstructions: "Preheat oven to 425 degrees F (220 degrees C).\nHeat olive oil and garlic in a small saucepan over low heat until warmed, 1 to 2 minutes. Transfer garlic and oil to a shallow bowl.\nBake in the preheated oven until no longer pink and juices run clear, 30 to 35 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).\n",
	Type:               "Recipe",
}

var jsonLDRecipe2 = JSONLDRecipe{
	CookTime: "P0DT0H35M",
	ImageURL: "https://homechart.app/homechart.png",
	MainEntityOfPage: map[string]any{
		"@id": "https://homechart.app/somerecipe",
	},
	Name:     "Tasty Chicken",
	PrepTime: "P0DT0H20M",
	RecipeCategory: []string{
		"Meat and Poultry",
		"Chicken",
		"Chicken Breasts",
	},
	RecipeYield: []any{
		"4 servings",
	},
	RecipeIngredient: []string{
		"¼ cup olive oil",
		"2 cloves garlic, crushed",
		"4 skinless, boneless chicken breast halves",
	},
	RecipeInstructions: "Preheat oven to 425 degrees F (220 degrees C).\nHeat olive oil and garlic in a small saucepan over low heat until warmed, 1 to 2 minutes. Transfer garlic and oil to a shallow bowl.\nBake in the preheated oven until no longer pink and juices run clear, 30 to 35 minutes. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).\n",
	Type: []any{
		"Page",
		"Recipe",
	},
}

func TestHTMLToJSONLDRecipe(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		err   error
		input string
		want  *JSONLDRecipe
	}{
		"invalid html": {
			err:   ErrImportRecipe,
			input: "<html>this isn't really html",
		},
		"no head": {
			err:   ErrImportRecipe,
			input: "<html><body><h1>Hello there</h1></body></html>",
		},
		"bad json ld": {
			err:   ErrImportRecipe,
			input: `<html><head><script type="application/ld+json">this isn't json</script></head></html>`,
		},
		"empty json ld": {
			err:   ErrImportRecipe,
			input: `<html><head><script type="application/ld+json">{}</script></head></html>`,
		},
		"good json ld single": {
			input: `<html><head><script type="application/ld+json">{"@type": "Recipe", "name": "A Recipe"}</script></head></html>`,
			want: &JSONLDRecipe{
				Name: "A Recipe",
				Type: "Recipe",
			},
		},
		"good json ld with image array": {
			input: `<html><head><script type="application/ld+json">{"@type": "Recipe", "name": "A Recipe", "image": ["https://homechart.app/homechart.png"]}</script></head></html>`,
			want: &JSONLDRecipe{
				ImageURL: "https://homechart.app/homechart.png",
				Name:     "A Recipe",
				Type:     "Recipe",
			},
		},
		"good json ld array 1": {
			input: htmlJSONLDRecipe1,
			want:  &jsonLDRecipe1,
		},
		"good json ld array 2": {
			input: htmlJSONLDRecipe2,
			want:  &jsonLDRecipe2,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := HTMLToJSONLDRecipe(ctx, tc.input)
			assert.HasErr(t, err, tc.err)
			assert.Equal(t, got, tc.want)
		})
	}
}
