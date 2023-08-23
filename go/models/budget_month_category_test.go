package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetMonthCategoriesRollup(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	bc := BudgetCategory{
		AuthHouseholdID: ah.ID,
		Grouping:        "a",
		Name:            "a",
	}
	bc.create(ctx, CreateOpts{})

	bmc1 := BudgetMonthCategory{
		Amount:           50000,
		AuthHouseholdID:  ah.ID,
		BudgetCategoryID: bc.ID,
		YearMonth:        types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 2)).YearMonth(),
	}
	bmc1.Create(ctx)

	bmc2 := BudgetMonthCategory{
		Amount:           50000,
		AuthHouseholdID:  ah.ID,
		BudgetCategoryID: bc.ID,
		YearMonth:        types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 1)).YearMonth(),
	}
	bmc2.Create(ctx)

	bt := BudgetTransaction{
		Amount:          10000,
		AuthHouseholdID: ah.ID,
		Date:            types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 2)),
		Categories: BudgetTransactionCategories{
			{
				Amount:           50000,
				BudgetCategoryID: &bc.ID,
				YearMonth:        types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 2)).YearMonth(),
			},
			{
				Amount:           50000,
				BudgetCategoryID: &bc.ID,
				YearMonth:        types.CivilDateOf(GenerateTimestamp()).AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 1)).YearMonth(),
			},
		},
	}
	bt.create(ctx, CreateOpts{})

	bm1 := BudgetMonth{
		AuthHouseholdID: bc.AuthHouseholdID,
		YearMonth:       bmc1.YearMonth,
	}
	bm1.Read(ctx)

	assert.Equal(t, len(bm1.BudgetMonthCategories), 1)

	bm2 := BudgetMonth{
		AuthHouseholdID: bc.AuthHouseholdID,
		YearMonth:       bmc2.YearMonth,
	}
	bm2.Read(ctx)

	assert.Equal(t, len(bm2.BudgetMonthCategories), 1)
	assert.Equal(t, bm2.BudgetMonthCategories[0].BudgetTransactionAmount, 50000)

	BudgetMonthCategoriesRollup(ctx)

	bm2 = BudgetMonth{
		AuthHouseholdID: bc.AuthHouseholdID,
		YearMonth:       bmc2.YearMonth,
	}
	bm2.Read(ctx)

	assert.Equal(t, bm2.BudgetMonthCategories[0].Amount, 0)
	assert.Equal(t, bm2.BudgetMonthCategories[0].BudgetTransactionAmount, 0)

	bm3 := BudgetMonth{
		AuthHouseholdID: bc.AuthHouseholdID,
		YearMonth:       types.CivilDateToday().AddMonths(-1 * c.App.RollupBudgetTransactionsBalanceMonths).YearMonth(),
	}
	bm3.Read(ctx)

	assert.Equal(t, bm3.BudgetMonthCategories[0].Amount, 100000)
	assert.Equal(t, bm3.BudgetMonthCategories[0].BudgetTransactionAmount, 100000)

	ah.Delete(ctx)
}

func TestBudgetMonthCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	bc := seed.BudgetCategories[0]
	bc.Income = true
	bc.Name = "Pets"
	bc.create(ctx, CreateOpts{})

	// Income with amounts should fail
	bmc := BudgetMonthCategory{
		Amount:           10000,
		AuthHouseholdID:  bc.AuthHouseholdID,
		BudgetCategoryID: bc.ID,
		YearMonth:        types.CivilDateOf(GenerateTimestamp()).AddMonths(-2).YearMonth(),
	}

	assert.Equal[error](t, bmc.Create(ctx), errs.ErrClientBadRequestMissing)

	bmc.Amount = 0

	assert.Equal(t, bmc.Create(ctx), nil)

	bc.Income = false
	bc.update(ctx, UpdateOpts{})

	bmc.Amount = 2000
	bmc.YearMonth = types.CivilDateOf(GenerateTimestamp()).AddMonths(-1).YearMonth()
	bmc.Create(ctx)

	Read(ctx, &bc, ReadOpts{})

	assert.Equal(t, bc.BudgetMonthCategoryAmount, bmc.Amount)

	bm := BudgetMonth{
		AuthHouseholdID: bc.AuthHouseholdID,
		YearMonth:       bmc.YearMonth,
	}
	bm.Read(ctx)

	assert.Equal(t, bm.BudgetMonthCategoryAmount, bmc.Amount)

	// Test delete
	db.Exec(ctx, "DELETE FROM budget_month_category WHERE budget_category_id = :budget_category_id AND auth_household_id = :auth_household_id", bmc)

	Read(ctx, &bc, ReadOpts{})

	assert.Equal(t, bc.BudgetMonthCategoryAmount, 0)

	Delete(ctx, &bc, DeleteOpts{})

	bm.Read(ctx)

	assert.Equal(t, bm.BudgetMonthCategoryAmount, 0)
}

func TestBudgetMonthCategoryRead(t *testing.T) {
	logger.UseTestLogger(t)

	b := BudgetMonthCategory{
		AuthHouseholdID:  seed.BudgetMonthCategories[0].AuthHouseholdID,
		BudgetCategoryID: seed.BudgetMonthCategories[0].BudgetCategoryID,
		YearMonth:        seed.BudgetMonthCategories[0].YearMonth,
	}

	assert.Equal(t, b.Read(ctx), nil)
	assert.Equal(t, b.Amount, seed.BudgetMonthCategories[0].Amount)
}

func TestBudgetMonthCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	bc := seed.BudgetCategories[1]
	bc.Name = "Pets"
	bc.create(ctx, CreateOpts{})

	bmc := BudgetMonthCategory{
		AuthHouseholdID:  seed.BudgetCategories[0].AuthHouseholdID,
		BudgetCategoryID: bc.ID,
		YearMonth:        types.CivilDateOf(GenerateTimestamp()).AddMonths(-2).YearMonth(),
	}
	bmc.Create(ctx)

	// Income should fail with amounts
	bmc.Amount = 10
	bmc.BudgetCategoryID = seed.BudgetCategories[3].ID

	assert.Equal[error](t, bmc.Update(ctx), errs.ErrClientNoContent)

	bmc.BudgetCategoryID = bc.ID

	assert.Equal(t, bmc.Update(ctx), nil)

	Read(ctx, &bc, ReadOpts{})

	assert.Equal(t, bc.BudgetMonthCategoryAmount, bmc.Amount)

	bm := BudgetMonth{
		AuthHouseholdID: bmc.AuthHouseholdID,
		YearMonth:       bmc.YearMonth,
	}
	bm.Read(ctx)

	bmc.Amount = 0

	assert.Equal(t, bmc.Update(ctx), nil)

	bm.Read(ctx)

	assert.Equal(t, bm.BudgetMonthCategoryAmount, bmc.Amount)

	Delete(ctx, &bc, DeleteOpts{})
}
