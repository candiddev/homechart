package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestCookRecipeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		err     error
		input   *CookRecipe
		notWant uuid.UUID
	}{
		"exists": {
			err: errs.ErrClientConflictExists,
			input: &CookRecipe{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Name:            seed.CookRecipes[0].Name,
			},
		},
		"new-with log": {
			input: &CookRecipe{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Notes: CookRecipeNotes{
					{
						Complexity: 5,
						Rating:     5,
					},
				},
				Name: "TestCookRecipeCreate",
			},
			notWant: uuid.Nil,
		},
		"new-no log": {
			input: &CookRecipe{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Complexity:      5,
				Name:            "TestCookRecipeCreate1",
				Rating:          5,
			},
			notWant: uuid.Nil,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.input.create(ctx, CreateOpts{}), tc.err)

			if tc.err == nil {
				assert.Equal(t, tc.input.ID != tc.notWant, true)
				assert.Equal(t, tc.input.Complexity, types.ScaleInt(5))
				assert.Equal(t, tc.input.Rating, types.ScaleInt(5))

				Delete(ctx, tc.input, DeleteOpts{})
			}
		})
	}

	// Existing short ID
	id := types.NewNanoid()
	c := seed.CookRecipes[0]
	c.Name = "create"
	c.ShortID = id

	assert.Equal(t, c.create(ctx, CreateOpts{
		Restore: true,
	}), nil)

	assert.Equal(t, c.ShortID, id)

	Delete(ctx, &c, DeleteOpts{})
}

func TestCookRecipeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookRecipes[0]
	c.Name = "TestCookRecipeUpdate"
	c.CookMealPlanLast = types.CivilDate{}
	c.create(ctx, CreateOpts{})
	c.Directions = "test"
	c.Image = "test"
	c.Ingredients = `2 onions, choppped
1/4 teaspoon salt`
	c.Notes = append(c.Notes, CookRecipeNote{
		Date:       types.CivilDateToday().AddDays(1),
		Complexity: 1,
		Note:       "Added recipe",
		Rating:     1,
	})
	c.Name = "TestCookRecipeUpdate1"
	c.Servings = "1-2"
	c.Source = "test"
	c.Tags = types.Tags{"breakfast", "yum"}
	c.TimeCook = 1
	c.TimePrep = 1

	notes := CookRecipeNotes{
		c.Notes[2],
		c.Notes[0],
		c.Notes[1],
	}

	assert.Equal(t, c.update(ctx, UpdateOpts{}), nil)

	cn := CookRecipe{
		ID:              c.ID,
		AuthHouseholdID: c.AuthHouseholdID,
	}
	Read(ctx, &cn, ReadOpts{})

	assert.Equal(t, cn, c)
	assert.Equal(t, cn.Notes, notes)

	// Test unique
	c.Name = seed.CookRecipes[0].Name

	assert.HasErr(t, c.update(ctx, UpdateOpts{}), errs.ErrClientConflictExists)

	Delete(ctx, &cn, DeleteOpts{})
}

func TestCookRecipesDelete(t *testing.T) {
	logger.UseTestLogger(t)

	c1 := seed.CookRecipes[0]
	c1.Name = "TestCookRecipesDelete"
	c1.create(ctx, CreateOpts{})

	tn := GenerateTimestamp()
	c1.Deleted = &tn
	c1.update(ctx, UpdateOpts{})

	old := c.App.KeepDeletedDays
	c.App.KeepDeletedDays = -1

	CookRecipesDelete(ctx)

	assert.Equal[error](t, Read(ctx, &c1, ReadOpts{}), errs.ErrClientBadRequestMissing)

	c.App.KeepDeletedDays = old
}
