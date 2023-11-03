package parse

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"golang.org/x/net/html"
)

var ErrImportRecipe = errs.ErrSenderBadRequest.Set(("Unable to import recipe from website"))

// JSONLDHowTo contains text.
type JSONLDHowTo struct {
	ItemListElement []JSONLDText `json:"itemListElement"`
	Name            string       `json:"name"`
	Text            string       `json:"text"`
}

// JSONLDText contains text.
type JSONLDText struct {
	Text string `json:"text"`
}

// JSONLDRecipe contains a recipe.
type JSONLDRecipe struct {
	CookTime              types.ISODuration `json:"cookTime"`
	Graph                 []JSONLDRecipe    `json:"@graph"`
	ImageRaw              any               `json:"image"`
	ImageURL              string            `json:"-"`
	MainEntityOfPage      any               `json:"mainEntityOfPage"`
	Name                  string            `json:"name"`
	PrepTime              types.ISODuration `json:"prepTime"`
	RecipeCategoryRaw     any               `json:"recipeCategory"`
	RecipeCategory        []string          `json:"-"`
	RecipeIngredient      []string          `json:"recipeIngredient"`
	RecipeInstructions    string            `json:"-"`
	RecipeInstructionsRaw json.RawMessage   `json:"recipeInstructions"`
	RecipeYield           any               `json:"recipeYield"`
	Type                  any               `json:"@type"`
}

// HTMLToJSONLDRecipe converts HTML to a JSONLDRecipe.
func HTMLToJSONLDRecipe(ctx context.Context, input string) (jsonld *JSONLDRecipe, err errs.Err) { //nolint:gocognit, gocyclo
	node, e := html.Parse(strings.NewReader(input))
	if e != nil {
		return jsonld, logger.Error(ctx, ErrImportRecipe.Wrap(e))
	}

	var getJSONLD func(node *html.Node)

	getJSONLD = func(node *html.Node) {
		if node.Type == html.ElementNode && node.Data == "script" {
			for _, attr := range node.Attr {
				if attr.Key == "type" && attr.Val == "application/ld+json" {
					// Attempt to unpack to a single struct
					err := json.Unmarshal([]byte(node.FirstChild.Data), &jsonld)
					if err != nil || jsonld.Type != "Recipe" { //nolint:goconst
						var jsonlds []JSONLDRecipe

						// Append any arrays
						err = json.Unmarshal([]byte(node.FirstChild.Data), &jsonlds)

						// Check if graph
						if jsonld != nil && jsonld.Graph != nil {
							jsonlds = append(jsonlds, jsonld.Graph...)
							err = nil
						}

						if err != nil || len(jsonlds) == 0 {
							logger.Error(ctx, ErrImportRecipe.Wrap(err)) //nolint:errcheck

							continue
						}

						match := false

						for _, item := range jsonlds {
							if t, ok := item.Type.([]any); ok {
								for i := range t {
									if s, ok := t[i].(string); ok && s == "Recipe" {
										*jsonld = item
										match = true

										break
									}
								}
							}

							// Are any of the array members a recipe
							if item.Type == "Recipe" {
								*jsonld = item
								match = true

								break
							}
						}

						if !match {
							logger.Error(ctx, ErrImportRecipe, fmt.Sprintf("jsonld type: %v", jsonld.Type)) //nolint:errcheck

							continue
						}
					} else if jsonld.Type != "Recipe" {
						logger.Error(ctx, errs.ErrSenderBadRequest.Wrap(errs.ErrSenderBadRequest), fmt.Sprintf("jsonld type: %v", jsonld.Type)) //nolint:errcheck

						continue
					}

					// If RecipeInstructionsRaw is a string or array
					if strings.HasPrefix(string(jsonld.RecipeInstructionsRaw), "[") {
						howTo := []JSONLDHowTo{}
						text := []JSONLDText{}

						if err := json.Unmarshal(jsonld.RecipeInstructionsRaw, &howTo); err == nil && len(howTo) > 0 && howTo[0].Name != "" {
							for i := range howTo {
								if len(howTo[i].ItemListElement) > 0 {
									for j := range howTo[i].ItemListElement {
										jsonld.RecipeInstructions += howTo[i].ItemListElement[j].Text + "\n"
									}
								} else if howTo[i].Text != "" {
									jsonld.RecipeInstructions += howTo[i].Text + "\n"
								}
							}
						} else if err := json.Unmarshal(jsonld.RecipeInstructionsRaw, &text); err == nil && len(text) > 0 {
							for i := range text {
								jsonld.RecipeInstructions += text[i].Text

								if i < len(text) && !strings.HasSuffix(text[i].Text, "\n") {
									jsonld.RecipeInstructions += "\n"
								}
							}
						}
					} else {
						jsonld.RecipeInstructions = string(jsonld.RecipeInstructionsRaw)
					}

					jsonld.RecipeInstructionsRaw = nil

					// If RecipeCategoryRaw is string or array
					if str, ok := jsonld.RecipeCategoryRaw.(string); ok {
						jsonld.RecipeCategory = []string{
							str,
						}
					} else if arr, ok := jsonld.RecipeCategoryRaw.([]any); ok {
						for _, item := range arr {
							if str, ok := item.(string); ok {
								jsonld.RecipeCategory = append(jsonld.RecipeCategory, str)
							}
						}
					}

					jsonld.RecipeCategoryRaw = nil

					// If ImageRaw is object or array
					if obj, ok := jsonld.ImageRaw.(map[string]any); ok {
						if url, ok := obj["url"].(string); ok {
							jsonld.ImageURL = url
						}
					} else if urls, ok := jsonld.ImageRaw.([]any); ok {
						if str, ok := urls[0].(string); ok {
							jsonld.ImageURL = str
						}
					}

					jsonld.ImageRaw = nil
					logger.Error(ctx, nil) //nolint:errcheck

					return
				}
			}
		}

		for child := node.FirstChild; child != nil; child = child.NextSibling {
			getJSONLD(child)
		}
	}

	getJSONLD(node)

	if jsonld == nil || jsonld.Name == "" {
		return nil, logger.Error(ctx, ErrImportRecipe)
	}

	return jsonld, logger.Error(ctx, nil)
}
