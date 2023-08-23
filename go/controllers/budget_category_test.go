package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.BudgetCategories[0]
	good.Name = "TestBudgetCategoriesCreate"

	var b models.BudgetCategories

	r := request{
		data:         good,
		method:       "POST",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/categories",
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, good.Name)

	b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &b[0], models.DeleteOpts{})
}

func TestBudgetCategoryDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.BudgetCategories[0]
	d.Name = "TestBudgetCategoryDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/budget/categories/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBudgetCategoryRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetCategories

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/categories/" + seed.BudgetCategories[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, seed.BudgetCategories[0].Name)
}

func TestBudgetCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	bc := seed.BudgetCategories[0]
	bc.Name = "TestBudgetCategoryUpdate"
	models.Create(ctx, &bc, models.CreateOpts{})

	newName := bc
	newName.Name = "TestBudgetCategoryUpdate1"

	var b models.BudgetCategories

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/categories/" + bc.ID.String(),
	}

	noError(t, r.do())

	b[0].AuthHouseholdID = newName.AuthHouseholdID
	b[0].Updated = newName.Updated

	assert.Equal(t, b[0], newName)

	models.Delete(ctx, &bc, models.DeleteOpts{})
}

func TestBudgetCategoriesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetCategories

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/budget/categories",
	}
	msg := r.do()

	noError(t, msg)

	assert.Equal(t, len(b), 0)
	assert.Equal(t, len(msg.DataIDs), 15)
}
