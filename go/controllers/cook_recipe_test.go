package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestCookRecipeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.CookRecipes[0]
	good.Name = "TestCookRecipeCreate"
	good.Tags = types.Tags{
		"This is a Test1",
		"This is a Test2",
	}

	var c models.CookRecipes

	r := request{
		data:         good,
		method:       "POST",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/cook/recipes",
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, good.Name)
	assert.Equal(t, c[0].Tags, types.Tags{
		"thisisatest1",
		"thisisatest2",
	})

	c[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &c[0], models.DeleteOpts{})
}

func TestCookRecipeDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.CookRecipes[0]
	d.Name = "TestCookRecipeDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/cook/recipes/" + d.ID.String(),
	}

	noError(t, r.do())

	cr := models.CookRecipe{
		ID:              d.ID,
		AuthHouseholdID: d.AuthHouseholdID,
	}

	assert.Equal[error](t, models.Read(ctx, &cr, models.ReadOpts{}), errs.ErrSenderNotFound)
}

func TestCookRecipeRead(t *testing.T) {
	logger.UseTestLogger(t)

	cr := seed.CookRecipes[1]
	cr.Name = "TestCookRecipeRead"
	models.Create(ctx, &cr, models.CreateOpts{})

	tests := map[string]struct {
		err     string
		session models.AuthSession
		uri     string
	}{
		"not public": {
			err:     errs.ErrSenderNotFound.Message(),
			session: models.AuthSession{},
			uri:     "/cook/recipes/" + cr.ID.String(),
		},
		"public": {
			session: models.AuthSession{},
			uri:     "/cook/recipes/" + seed.CookRecipes[0].ID.String(),
		},
		"auth not public": {
			session: seed.AuthSessions[0],
			uri:     "/cook/recipes/" + cr.ID.String(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var c models.CookRecipes

			r := request{
				method:       "GET",
				responseType: &c,
				session:      tc.session,
				uri:          tc.uri,
			}

			if name == "updated" {
				r.updated = cr.Updated
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				if !c[0].Public {
					assert.Equal(t, c[0].Name, cr.Name)
				}
			}
		})
	}

	models.Delete(ctx, &cr, models.DeleteOpts{})
}

func TestCookRecipesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var a models.CookRecipes

	r := request{
		method:       "GET",
		responseType: &a,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/cook/recipes",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(a), 0)
	assert.Equal(t, len(msg.DataIDs), 4)
}

func TestCookRecipeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	cr := seed.CookRecipes[0]
	cr.Name = "TestCookRecipeUpdate"
	models.Create(ctx, &cr, models.CreateOpts{})

	newName := cr
	newName.Name = "TestCookRecipeUpdate1"

	r := request{
		data:    newName,
		method:  "PUT",
		session: seed.AuthSessions[0],
		uri:     "/cook/recipes/" + cr.ID.String(),
	}

	noError(t, r.do())

	crn := models.CookRecipe{
		ID:              cr.ID,
		AuthHouseholdID: cr.AuthHouseholdID,
	}
	models.Read(ctx, &crn, models.ReadOpts{})

	assert.Equal(t, crn.Name, newName.Name)

	models.Delete(ctx, &cr, models.DeleteOpts{})
}
