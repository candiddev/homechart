package controllers

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetAccountCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.BudgetAccounts[0]
	good.Name = "TestBudgetAccountCreate"

	var b models.BudgetAccounts

	r := request{
		data:         good,
		method:       "POST",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/accounts",
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, good.Name)

	b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &b[0], models.DeleteOpts{})
}

func TestBudgetAccountDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.BudgetAccounts[0]
	d.Name = "TestBudgetAccountDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/budget/accounts/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBudgetAccountRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetAccounts

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/accounts/" + seed.BudgetAccounts[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, seed.BudgetAccounts[0].Name)
}

func TestBudgetAccountReconcile(t *testing.T) {
	logger.UseTestLogger(t)

	ba := seed.BudgetAccounts[0]
	ba.Name = "test"
	models.Create(ctx, &ba, models.CreateOpts{})

	bt := seed.BudgetTransactions[0].Accounts[0]
	bt.BudgetAccountID = &ba.ID
	bt.Status = 1
	models.Create(ctx, &bt, models.CreateOpts{})

	r := request{
		method:  "POST",
		session: seed.AuthSessions[0],
		uri:     fmt.Sprintf("/budget/accounts/%s/reconcile", ba.ID.String()),
	}

	noError(t, r.do())

	models.Read(ctx, &ba, models.ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmountReconciled, bt.Amount)

	models.Delete(ctx, &bt, models.DeleteOpts{})
	models.Delete(ctx, &ba, models.DeleteOpts{})
}

func TestBudgetAccountUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	ba := seed.BudgetAccounts[0]
	ba.Name = "TestBudgetAccountUpdate"
	models.Create(ctx, &ba, models.CreateOpts{})

	newName := ba
	newName.Name = "TestBudgetAccountUpdate1"

	var b models.BudgetAccounts

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/accounts/" + ba.ID.String(),
	}

	noError(t, r.do())

	b[0].AuthHouseholdID = newName.AuthHouseholdID
	b[0].Updated = newName.Updated

	assert.Equal(t, b[0], newName)

	models.Delete(ctx, &ba, models.DeleteOpts{})
}

func TestBudgetAccountsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetAccounts

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/budget/accounts",
	}

	msg := r.do()

	noError(t, r.do())
	assert.Equal(t, len(b), 0)
	assert.Equal(t, len(msg.DataIDs), 6)
}
