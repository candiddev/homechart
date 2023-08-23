package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetPayeeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.BudgetPayees[0]
	good.Name = "TestBudgetPayeesCreate"

	var b models.BudgetPayees

	r := request{
		data:         good,
		method:       "POST",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/payees",
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, good.Name)

	b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &b[0], models.DeleteOpts{})
}

func TestBudgetPayeeDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.BudgetPayees[0]
	d.Name = "TestBudgetPayeeDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/budget/payees/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBudgetPayeeRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetPayees

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/payees/" + seed.BudgetPayees[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, seed.BudgetPayees[0].Name)
}

func TestBudgetPayeeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	bi := seed.BudgetPayees[0]
	bi.Name = "TestBudgetPayeeUpdate"
	models.Create(ctx, &bi, models.CreateOpts{})

	newName := bi
	newName.Name = "TestBudgetPayeeUpdate1"

	var b models.BudgetPayees

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/payees/" + bi.ID.String(),
	}

	noError(t, r.do())

	b[0].AuthHouseholdID = newName.AuthHouseholdID
	b[0].Updated = newName.Updated

	assert.Equal(t, b[0], newName)

	models.Delete(ctx, &bi, models.DeleteOpts{})
}

func TestBudgetPayeesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetPayees

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/budget/payees",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(b), 0)
	assert.Equal(t, len(msg.DataIDs), 6)
}
