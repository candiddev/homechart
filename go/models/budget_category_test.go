package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetCategories[0]
	b.Income = true
	b.Name = "Income"

	assert.Equal(t, b.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, b.ID != seed.BudgetCategories[0].ID, true)

	bn := b

	assert.Equal(t, bn.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, bn, b)

	// Create a transaction to test budget month income calculations
	bt := seed.BudgetTransactions[0]
	bt.Accounts = BudgetTransactionAccounts{
		{
			Amount:          100000,
			BudgetAccountID: &seed.BudgetAccounts[0].ID,
		},
	}
	bt.Categories = BudgetTransactionCategories{
		{
			Amount:           100000,
			BudgetCategoryID: &b.ID,
			YearMonth:        types.CivilDateOf(GenerateTimestamp()).YearMonth(),
		},
	}
	bt.create(ctx, CreateOpts{})

	m := BudgetMonth{
		AuthHouseholdID: b.AuthHouseholdID,
		YearMonth:       bt.Categories[0].YearMonth,
	}
	m.Read(ctx)

	Delete(ctx, &b, DeleteOpts{})

	// BudgetMonth Trigger
	want := m.BudgetTransactionAmountIncome - bt.Amount
	m.Read(ctx)
	assert.Equal(t, m.BudgetTransactionAmountIncome, want)

	Delete(ctx, &bt, DeleteOpts{})

	// Existing short ID
	id := types.NewNanoid()
	b = seed.BudgetCategories[0]
	b.Name = "create"
	b.ShortID = id

	assert.Equal(t, b.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, b.ShortID, id)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetCategories[0]
	b.Name = "CC"
	b.create(ctx, CreateOpts{})

	btc := seed.BudgetTransactions[0].Categories[0]
	btc.Amount = 100000
	btc.BudgetCategoryID = &b.ID
	btc.YearMonth = 201901
	btc.create(ctx, CreateOpts{})

	b.Name = "CC2"
	b.Income = true
	b.Grouping = "test2"

	assert.Equal(t, b.update(ctx, UpdateOpts{}), nil)

	category := BudgetCategory{
		AuthHouseholdID: b.AuthHouseholdID,
		ID:              b.ID,
	}

	Read(ctx, &category, ReadOpts{})

	assert.Equal(t, category, b)

	// Test income switching
	month := BudgetMonth{
		AuthHouseholdID: btc.AuthHouseholdID,
		YearMonth:       btc.YearMonth,
	}
	month.Read(ctx)

	assert.Equal(t, month.BudgetTransactionAmountIncome, btc.Amount)

	b.Income = false
	b.update(ctx, UpdateOpts{})
	month.Read(ctx)

	assert.Equal(t, month.BudgetTransactionAmountIncome, 0)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetCategoryValidate(t *testing.T) {
	a := 1
	tests := map[string]struct {
		err   error
		input BudgetCategory
	}{
		"income with targets": {
			err: ErrBudgetCategory,
			input: BudgetCategory{
				Income:       true,
				TargetAmount: a,
			},
		},
		"income": {
			input: BudgetCategory{
				Income: true,
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.input.Validate(), tc.err)
		})
	}
}

func TestBudgetCategoriesInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	tests := []string{
		"new",
		"exists",
	}

	for _, name := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, BudgetCategoriesInit(ctx, ah.ID), nil)
		})
	}

	ah.Delete(ctx)
}
