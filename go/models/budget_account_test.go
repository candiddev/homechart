package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetAccountCreate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetAccounts[0]
	b.Budget = true
	b.Hidden = true
	b.Icon = "icon"
	b.Name = "Mortgage"

	assert.Equal(t, b.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, b.ID != seed.BudgetAccounts[0].ID, true)
	assert.Equal(t, b.Budget, true)

	// Existing short ID
	id := types.NewNanoid()
	b = seed.BudgetAccounts[0]
	b.Name = "create"
	b.ShortID = id

	assert.Equal(t, b.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, b.ShortID, id)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetAccountUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetAccounts[0]
	b.Budget = false
	b.Name = "CC"
	b.create(ctx, CreateOpts{})
	b.Budget = true
	b.Icon = "icon"
	b.Hidden = true
	b.Name = "CC2"
	assert.Equal(t, b.update(ctx, UpdateOpts{}), nil)

	account := BudgetAccount{
		AuthHouseholdID: b.AuthHouseholdID,
		ID:              b.ID,
	}

	Read(ctx, &account, ReadOpts{})

	assert.Equal(t, account, b)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetAccountsInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	tests := []error{
		nil,
		errs.ErrClientConflictExists,
	}

	for _, tc := range tests {
		assert.HasErr(t, BudgetAccountsInit(ctx, ah.ID), tc)
	}

	ah.Delete(ctx)
}
