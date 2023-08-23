package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestCookMealPlanCreate(t *testing.T) {
	logger.UseTestLogger(t)

	var c models.CookMealPlan
	c.AuthHouseholdID = seed.AuthHouseholds[0].ID
	c.CookMealTimeID = seed.CookMealPlans[0].CookMealTimeID
	c.CookRecipeID = &seed.CookRecipes[1].ID
	c.Date = seed.CookMealPlans[0].Date
	c.Time = seed.CookMealPlans[0].Time

	var o models.CookMealPlans

	r := request{
		data:         c,
		method:       "POST",
		responseType: &o,
		session:      seed.AuthSessions[0],
		uri:          "/cook/meal-plans",
	}

	noError(t, r.do())

	assert.Equal(t, o[0].CookRecipeID, &seed.CookRecipes[1].ID)

	o[0].AuthHouseholdID = seed.AuthHouseholds[0].ID

	models.Delete(ctx, &o[0], models.DeleteOpts{})
}

func TestCookMealPlanDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.CookMealPlans[0]
	d.CookRecipeID = &seed.CookRecipes[1].ID
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/cook/meal-plans/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestCookMealPlansRead(t *testing.T) {
	logger.UseTestLogger(t)

	var c models.CookMealPlans

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/cook/meal-plans",
	}

	noError(t, r.do())
	assert.Equal(t, len(c), len(seed.CookMealPlans))
}

func TestCookMealPlanUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookMealPlans[0]
	c.CustomRecipe = ""
	c.CookRecipeID = &seed.CookRecipes[1].ID
	models.Create(ctx, &c, models.CreateOpts{})

	newRecipe := c
	newRecipe.CookRecipeID = &seed.CookRecipes[2].ID

	r := request{
		data:    newRecipe,
		method:  "PUT",
		session: seed.AuthSessions[0],
		uri:     "/cook/meal-plans/" + c.ID.String(),
	}

	noError(t, r.do())

	models.Delete(ctx, &c, models.DeleteOpts{})
}
