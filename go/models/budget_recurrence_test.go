package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetRecurrenceCreate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetRecurrences[0]
	b.BudgetAccountID = seed.BudgetAccounts[1].ID

	assert.Equal(t, b.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, b.ID != seed.BudgetRecurrences[0].ID, true)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetRecurrenceUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetRecurrences[0]
	b.BudgetAccountID = seed.BudgetAccounts[0].ID
	b.create(ctx, CreateOpts{})
	b.BudgetAccountID = seed.BudgetAccounts[2].ID
	b.Recurrence = seed.BudgetRecurrences[2].Recurrence
	b.Template = seed.BudgetRecurrences[2].Template

	assert.Equal(t, b.update(ctx, UpdateOpts{}), nil)

	recurrence := BudgetRecurrence{
		AuthHouseholdID: b.AuthHouseholdID,
		ID:              b.ID,
	}

	Read(ctx, &recurrence, ReadOpts{})

	assert.Equal(t, recurrence.Recurrence, seed.BudgetRecurrences[2].Recurrence)

	Delete(ctx, &b, DeleteOpts{})
}
