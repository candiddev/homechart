package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/images"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// CookRecipe defines recipe fields.
type CookRecipe struct {
	Deleted           *time.Time        `db:"deleted" format:"date-time" json:"deleted"`
	AuthHouseholdID   uuid.UUID         `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	ID                uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Notes             CookRecipeNotes   `db:"notes" json:"notes"`
	Created           time.Time         `db:"created" format:"date-time" json:"created"`
	Updated           time.Time         `db:"updated" format:"date-time" json:"updated"`
	CookMealPlanLast  types.CivilDate   `db:"cook_meal_plan_last" format:"date" json:"cookMealPlanLast" swaggertype:"string"`
	Tags              types.Tags        `db:"tags" json:"tags"`
	Public            bool              `db:"public" json:"public"`
	CookMealPlanCount int               `db:"cook_meal_plan_count" json:"cookMealPlanCount"`
	TimeCook          types.PositiveInt `db:"time_cook" json:"timeCook"`
	TimePrep          types.PositiveInt `db:"time_prep" json:"timePrep"`
	Complexity        types.ScaleInt    `db:"complexity" json:"complexity"`
	Rating            types.ScaleInt    `db:"rating" json:"rating"`
	Image             images.Image      `db:"image" json:"image"`
	Directions        string            `db:"directions" json:"directions"`
	Ingredients       string            `db:"ingredients" json:"ingredients"`
	Name              types.StringLimit `db:"name" json:"name"`
	Servings          types.StringLimit `db:"servings" json:"servings"`
	ShortID           types.Nanoid      `db:"short_id" json:"shortID"`
	Source            types.StringLimit `db:"source" json:"source"`
} // @Name CookRecipe

// CookRecipesTag is used when return tag list.
type CookRecipesTag struct {
	Count int    `db:"count" json:"count"`
	Name  string `db:"name" json:"name"`
}

func (c *CookRecipe) SetID(id uuid.UUID) {
	c.ID = id
}

func (c *CookRecipe) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if c.Notes == nil || (len(c.Notes) == 0 && (c.Complexity > 0 || c.Rating > 0)) {
		c.Notes = CookRecipeNotes{
			{
				Date:       types.CivilDateToday(),
				Complexity: c.Complexity,
				Note:       types.StringLimit(yaml8n.ObjectRecipeNote.Translate(GetISO639Code(ctx))),
				Rating:     c.Rating,
			},
		}
	}

	if len(c.Notes) > 1 {
		c.Notes.ValidateAndSort()
	}

	// Set properties
	c.ID = GenerateUUID()

	if !opts.Restore || c.ShortID == "" {
		c.ShortID = types.NewNanoid()
	}

	return logger.Error(ctx, db.Query(ctx, false, c, `
INSERT INTO cook_recipe (
	  auth_household_id
	, directions
	, id
	, image
	, ingredients
	, name
	, notes
	, public
	, servings
	, short_id
	, source
	, tags
	, time_cook
	, time_prep
) VALUES (
	  :auth_household_id
	, :directions
	, :id
	, :image
	, :ingredients
	, :name
	, :notes
	, :public
	, :servings
	, :short_id
	, :source
	, :tags
	, :time_cook
	, :time_prep
)
RETURNING *
`, c))
}

func (c *CookRecipe) getChange(_ context.Context) string {
	return string(c.Name)
}

func (c *CookRecipe) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &c.AuthHouseholdID, &c.ID
}

func (*CookRecipe) getType() modelType {
	return modelCookRecipe
}

func (c *CookRecipe) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		c.AuthHouseholdID = *authHouseholdID
	}
}

func (c *CookRecipe) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if c.Notes == nil || (len(c.Notes) == 0 && (c.Complexity > 0 || c.Rating > 0)) {
		c.Notes = CookRecipeNotes{
			{
				Date:       types.CivilDateOf(c.Created),
				Complexity: c.Complexity,
				Note:       types.StringLimit(yaml8n.ObjectRecipeNote.Translate(GetISO639Code(ctx))),
				Rating:     c.Rating,
			},
		}
	}

	if len(c.Notes) > 1 {
		c.Notes.ValidateAndSort()
	}

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, c, `
UPDATE cook_recipe
SET
	  deleted = :deleted
	, directions = :directions
	, image = :image
	, ingredients = :ingredients
	, name = :name
	, notes = :notes
	, public = :public
	, servings = :servings
	, source = :source
	, tags = :tags
	, time_cook = :time_cook
	, time_prep = :time_prep
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, c))
}

// CookRecipes contains multiple CookRecipe.
type CookRecipes []CookRecipe

func (*CookRecipes) getType() modelType {
	return modelCookRecipe
}

// CookRecipesDelete deletes all recipes that were marked for deletion.
func CookRecipesDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf("DELETE FROM cook_recipe WHERE deleted > '0001-01-01' AND deleted < now() - INTERVAL '%d day'", c.App.KeepDeletedDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}
