package models

import (
	"fmt"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetMonthsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ym := types.CivilDateToday().AddMonths(-2 * c.App.RollupBudgetTransactionsBalanceMonths).YearMonth()

	db.Exec(ctx, fmt.Sprintf(`
INSERT INTO budget_month (
	  auth_household_id
	, year_month
) VALUES (
	  '%s'
	, %d
)
`, seed.AuthHouseholds[0].ID, ym), nil)

	ym = types.CivilDateToday().AddMonths(2 * c.App.RollupBudgetTransactionsBalanceMonths).YearMonth()

	db.Exec(ctx, fmt.Sprintf(`
INSERT INTO budget_month (
	  auth_household_id
	, budget_transaction_amount_income
	, year_month
) VALUES (
	  '%s'
	, 1000
	, %d
)
`, seed.AuthHouseholds[0].ID, ym), nil)

	BudgetMonthsDelete(ctx)

	var bm BudgetMonths

	db.Query(ctx, true, &bm, "SELECT * FROM budget_month WHERE auth_household_id = $1", nil, seed.AuthHouseholds[0].ID)

	assert.Equal(t, len(bm), 2)

	db.Exec(ctx, fmt.Sprintf("DELETE FROM budget_month WHERE auth_household_id = '%s' AND year_month = %d", seed.AuthHouseholds[0].ID, ym), nil)
}

func TestBudgetMonthRead(t *testing.T) {
	logger.UseTestLogger(t)

	b := BudgetMonth{
		AuthHouseholdID: seed.BudgetMonthCategories[0].AuthHouseholdID,
		YearMonth:       seed.BudgetMonthCategories[0].YearMonth,
	}
	bw := b
	bw.BudgetMonthCategoryAmount = 60000
	bw.BudgetTransactionAmountIncomeRemaining = 40000
	bw.BudgetTransactionAmountIncome = 100000

	assert.Equal(t, b.Read(ctx), nil)

	bg := b
	bg.BudgetMonthCategories = nil

	assert.Equal(t, bg, bw)
	assert.Equal(t, len(b.BudgetMonthCategories), 15)

	want := BudgetMonthCategory{
		Amount:          30000,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Balance:         25000,
		BudgetCategory: BudgetCategory{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        seed.BudgetCategories[1].Grouping,
			Name:            seed.BudgetCategories[1].Name,
			ShortID:         seed.BudgetCategories[1].ShortID,
			TargetAmount:    seed.BudgetCategories[1].TargetAmount,
			TargetMonth:     seed.BudgetCategories[1].TargetMonth,
			TargetYear:      seed.BudgetCategories[1].TargetYear,
		},
		BudgetCategoryID:        seed.BudgetMonthCategories[0].BudgetCategoryID,
		BudgetTransactionAmount: -5000,
		Created:                 seed.BudgetCategories[1].Created,
		YearMonth:               b.YearMonth,
	}

	gotCategory := BudgetMonthCategory{}

	for _, category := range b.BudgetMonthCategories {
		if category.BudgetCategoryID == seed.BudgetCategories[1].ID {
			gotCategory = category
		}
	}

	assert.Equal(t, gotCategory, want)

	b.BudgetMonthCategories = BudgetMonthCategories{}
	b.YearMonth = types.CivilDateOf(GenerateTimestamp()).AddMonths(100).YearMonth()

	assert.Equal(t, b.Read(ctx), nil)
	assert.Equal(t, len(b.BudgetMonthCategories), 15)

	b.BudgetMonthCategories = BudgetMonthCategories{}
	b.YearMonth = types.CivilDateOf(GenerateTimestamp()).AddMonths(5).YearMonth()

	assert.Equal(t, b.Read(ctx), nil)
	assert.Equal(t, len(b.BudgetMonthCategories), 15)

	gotBalance := 0

	for _, category := range b.BudgetMonthCategories {
		if category.BudgetCategoryID == seed.BudgetMonthCategories[0].BudgetCategoryID {
			gotBalance = category.Balance
		}
	}

	assert.Equal(t, gotBalance, 15000)
}
