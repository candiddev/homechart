package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetTransactionCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	btc := seed.BudgetTransactions[0].Categories[0]
	btc.Amount = 2000
	btc.BudgetCategoryID = &seed.BudgetCategories[4].ID

	// Get BudgetCategory pre-trigger
	bc := BudgetCategory{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		ID:              seed.BudgetCategories[4].ID,
	}

	Read(ctx, &bc, ReadOpts{})

	// Get BudgetMonth pre-trigger
	bm := BudgetMonth{
		AuthHouseholdID: btc.AuthHouseholdID,
		YearMonth:       btc.YearMonth,
	}
	bm.Read(ctx)

	// Get BudgetMonthCategory pre-trigger
	bmc := BudgetMonthCategory{
		AuthHouseholdID:  btc.AuthHouseholdID,
		BudgetCategoryID: *btc.BudgetCategoryID,
		YearMonth:        btc.YearMonth,
	}
	bmc.Read(ctx)

	assert.Equal(t, btc.create(ctx, CreateOpts{}), nil)

	// Test triggers
	// BudgetCategory
	want := bc.BudgetTransactionAmount + btc.Amount
	Read(ctx, &bc, ReadOpts{})

	assert.Equal(t, bc.BudgetTransactionAmount, want)

	// BudgetMonth
	want = bm.BudgetTransactionAmountIncome + btc.Amount
	bm.Read(ctx)

	assert.Equal(t, bm.BudgetTransactionAmountIncome, want)

	// BudgetMonthCategory
	want = bmc.BudgetTransactionAmount + btc.Amount
	bmc.Read(ctx)

	assert.Equal(t, bmc.BudgetTransactionAmount, want)

	// Delete and check delete triggers
	Delete(ctx, &btc, DeleteOpts{})

	// BudgetCategory
	want = bc.BudgetTransactionAmount - btc.Amount
	Read(ctx, &bc, ReadOpts{})

	assert.Equal(t, bc.BudgetTransactionAmount, want)

	// BudgetMonth
	want = bm.BudgetTransactionAmountIncome - btc.Amount
	bm.Read(ctx)

	assert.Equal(t, bm.BudgetTransactionAmountIncome, want)

	// BudgetMonthCategory
	want = bmc.BudgetTransactionAmount - btc.Amount
	bmc.Read(ctx)

	assert.Equal(t, bmc.BudgetTransactionAmount, want)
}

func TestBudgetTransactionCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	bc := seed.BudgetCategories[4]
	bc.Name = "Test"
	bc.Income = true
	bc.create(ctx, CreateOpts{})

	btco := seed.BudgetTransactions[0].Categories[0]
	btco.Amount = 2000
	btco.BudgetCategoryID = &seed.BudgetCategories[4].ID
	btco.create(ctx, CreateOpts{})

	btcn := btco
	btcn.Amount = 1000
	btcn.BudgetCategoryID = &bc.ID
	btcn.YearMonth = 201910

	// Get BudgetCategory pre-trigger
	bco := BudgetCategory{
		AuthHouseholdID: btco.AuthHouseholdID,
		ID:              *btco.BudgetCategoryID,
	}

	bcn := BudgetCategory{
		AuthHouseholdID: btcn.AuthHouseholdID,
		ID:              *btcn.BudgetCategoryID,
	}

	Read(ctx, &bco, ReadOpts{})
	Read(ctx, &bcn, ReadOpts{})

	// Get BudgetMonth pre-trigger
	bmO := BudgetMonth{
		AuthHouseholdID: btco.AuthHouseholdID,
		YearMonth:       btco.YearMonth,
	}
	bmO.Read(ctx)

	// Get BudgetMonthCategory pre-trigger
	bmco := BudgetMonthCategory{
		AuthHouseholdID:  btco.AuthHouseholdID,
		BudgetCategoryID: *btco.BudgetCategoryID,
		YearMonth:        btco.YearMonth,
	}
	bmco.Read(ctx)

	assert.Equal(t, btcn.update(ctx, UpdateOpts{}), nil)

	out := BudgetTransactionCategory{
		AuthHouseholdID: btcn.AuthHouseholdID,
		ID:              btcn.ID,
	}

	Read(ctx, &out, ReadOpts{})

	assert.Equal(t, btcn, out)

	// Read new items
	bmN := BudgetMonth{
		AuthHouseholdID: btcn.AuthHouseholdID,
		YearMonth:       btcn.YearMonth,
	}
	bmN.Read(ctx)

	bmcn := BudgetMonthCategory{
		AuthHouseholdID:  btcn.AuthHouseholdID,
		BudgetCategoryID: *btcn.BudgetCategoryID,
		YearMonth:        btcn.YearMonth,
	}
	bmcn.Read(ctx)

	// Test triggers
	// BudgetCategory
	want := bco.BudgetTransactionAmount - btco.Amount
	Read(ctx, &bco, ReadOpts{})

	assert.Equal(t, bco.BudgetTransactionAmount, want)

	want = bcn.BudgetTransactionAmount + btcn.Amount
	Read(ctx, &bcn, ReadOpts{})

	assert.Equal(t, bcn.BudgetTransactionAmount, want)

	// BudgetMonth
	want = bmO.BudgetTransactionAmountIncome - btco.Amount
	bmO.Read(ctx)

	assert.Equal(t, bmO.BudgetTransactionAmountIncome, want)
	assert.Equal(t, bmN.BudgetTransactionAmountIncome, btcn.Amount)

	// BudgetMonthCategory
	want = bmco.BudgetTransactionAmount - btco.Amount
	bmco.Read(ctx)

	assert.Equal(t, bmco.BudgetTransactionAmount, want)
	assert.Equal(t, bmcn.BudgetTransactionAmount, btcn.Amount)

	btcn.BudgetCategoryID = &seed.BudgetCategories[1].ID
	btcn.update(ctx, UpdateOpts{})

	bmN.Read(ctx)

	assert.Equal(t, bmN.BudgetTransactionAmountIncome, 0)

	Delete(ctx, &btcn, DeleteOpts{})
	Delete(ctx, &bc, DeleteOpts{})
}
