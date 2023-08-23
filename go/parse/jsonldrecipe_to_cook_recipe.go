package parse

import (
	"context"
	"fmt"
	"image"
	"net/http"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/images"
	"github.com/candiddev/shared/go/types"
)

// ToCookRecipe converts a JSONLDRecipe to CookRecipe.
func (j *JSONLDRecipe) ToCookRecipe(ctx context.Context) (c *models.CookRecipe) {
	c = &models.CookRecipe{}

	if j.ImageURL != "" {
		r, err := http.NewRequestWithContext(ctx, http.MethodGet, j.ImageURL, nil)
		if err != nil {
			return c
		}

		client := &http.Client{}

		resp, err := client.Do(r)
		if err != nil {
			return c
		}

		img, _, err := image.Decode(resp.Body)
		if err == nil {
			c.Image = types.Image(images.Resize(img))
		}

		defer resp.Body.Close()
	}

	c.Directions = j.RecipeInstructions
	c.Ingredients = strings.Join(j.RecipeIngredient, "\n")
	c.Name = types.StringLimit(j.Name)

	if t, ok := j.RecipeYield.([]any); ok {
		for i := range t {
			c.Servings = types.StringLimit(fmt.Sprint(t[i]))
		}
	} else if t, ok := j.RecipeYield.(string); ok {
		c.Servings = types.StringLimit(t)
	}

	if t, ok := j.MainEntityOfPage.(map[string]any); ok {
		if s, ok := t["@id"].(string); ok {
			c.Source = types.StringLimit(s)
		}
	} else if s, ok := j.MainEntityOfPage.(string); ok {
		c.Source = types.StringLimit(s)
	}

	c.Tags.ParseSlice(j.RecipeCategory)
	c.TimeCook = types.PositiveInt(j.CookTime.Minutes())
	c.TimePrep = types.PositiveInt(j.PrepTime.Minutes())

	return c
}
