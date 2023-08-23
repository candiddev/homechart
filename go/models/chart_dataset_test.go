package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestChartDatasetsReadBudget(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	ba1 := seed.BudgetAccounts[0]
	ba1.AuthHouseholdID = ah.ID
	ba1.create(ctx, CreateOpts{})

	ba2 := seed.BudgetAccounts[0]
	ba2.AuthHouseholdID = ah.ID
	ba2.Name = "off"
	ba2.Budget = false
	ba2.create(ctx, CreateOpts{})

	bp1 := seed.BudgetPayees[0]
	bp1.AuthHouseholdID = ah.ID
	bp1.create(ctx, CreateOpts{})

	bp2 := seed.BudgetPayees[1]
	bp2.AuthHouseholdID = ah.ID
	bp2.create(ctx, CreateOpts{})

	bp3 := seed.BudgetPayees[2]
	bp3.AuthHouseholdID = ah.ID
	bp3.create(ctx, CreateOpts{})

	bc1 := seed.BudgetCategories[2]
	bc1.AuthHouseholdID = ah.ID
	bc1.create(ctx, CreateOpts{})

	bc2 := seed.BudgetCategories[1]
	bc2.AuthHouseholdID = ah.ID
	bc2.create(ctx, CreateOpts{})

	bc3 := seed.BudgetCategories[0]
	bc3.AuthHouseholdID = ah.ID
	bc3.Grouping = ""
	bc3.create(ctx, CreateOpts{})

	bt1 := BudgetTransaction{
		Accounts: BudgetTransactionAccounts{
			{
				Amount:          -10000,
				BudgetAccountID: &ba1.ID,
			},
		},
		Amount:          -10000,
		AuthHouseholdID: ah.ID,
		BudgetPayeeID:   &bp1.ID,
		Categories: BudgetTransactionCategories{
			{
				Amount:           -10000,
				BudgetCategoryID: &bc1.ID,
				YearMonth:        types.CivilDateToday().YearMonth(),
			},
		},
		Date: types.CivilDateToday(),
	}
	bt1.create(ctx, CreateOpts{})

	bt2 := BudgetTransaction{
		Accounts: BudgetTransactionAccounts{
			{
				Amount:          -20000,
				BudgetAccountID: &ba1.ID,
			},
		},
		Amount:          -20000,
		AuthHouseholdID: ah.ID,
		BudgetPayeeID:   &bp2.ID,
		Categories: BudgetTransactionCategories{
			{
				Amount:           -20000,
				BudgetCategoryID: &bc2.ID,
				YearMonth:        types.CivilDateToday().AddMonths(-1).YearMonth(),
			},
		},
		Date: types.CivilDateToday().AddMonths(-1),
	}
	bt2.create(ctx, CreateOpts{})

	bt3 := BudgetTransaction{
		Accounts: BudgetTransactionAccounts{
			{
				Amount:          30000,
				BudgetAccountID: &ba1.ID,
			},
		},
		Amount:          30000,
		AuthHouseholdID: ah.ID,
		BudgetPayeeID:   &bp3.ID,
		Categories: BudgetTransactionCategories{
			{
				Amount:           30000,
				BudgetCategoryID: &bc3.ID,
				YearMonth:        types.CivilDateToday().AddMonths(-2).YearMonth(),
			},
		},
		Date: types.CivilDateToday().AddMonths(-2),
	}
	bt3.create(ctx, CreateOpts{})

	bt4 := BudgetTransaction{
		Accounts: BudgetTransactionAccounts{
			{
				Amount:          -20000,
				BudgetAccountID: &ba1.ID,
			},
			{
				Amount:          20000,
				BudgetAccountID: &ba2.ID,
			},
		},
		Amount:          -20000,
		AuthHouseholdID: ah.ID,
		Date:            types.CivilDateToday().AddMonths(-2),
	}
	bt4.create(ctx, CreateOpts{})

	tests := map[string]struct {
		inputFrom             types.YearMonth
		inputTo               types.YearMonth
		wantCategories        ChartDatasets
		wantCategoryGroupings ChartDatasets
		wantIncomeExpense     ChartDatasets
		wantPayees            ChartDatasets
	}{
		"this month": {
			inputFrom: types.CivilDateToday().YearMonth(),
			inputTo:   types.CivilDateToday().YearMonth(),
			wantCategories: ChartDatasets{
				{
					Name: string(bc1.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
			wantCategoryGroupings: ChartDatasets{
				{
					Name: string(bc1.Grouping),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
			wantIncomeExpense: ChartDatasets{
				{
					Name: bt1.Date.YearMonth().StringDash(),
					Values: ChartValues{
						{
							Name:  "total",
							Value: bt1.Amount + bt2.Amount + bt3.Amount,
						},
						{
							Name:  "income",
							Value: 0,
						},
						{
							Name:  "expense",
							Value: bt1.Amount * -1,
						},
					},
				},
			},
			wantPayees: ChartDatasets{
				{
					Name: string(bp1.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
		},
		"last three months": {
			inputFrom: types.CivilDateToday().AddMonths(-2).YearMonth(),
			inputTo:   types.CivilDateToday().YearMonth(),
			wantCategories: ChartDatasets{
				{
					Name: string(bc2.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt2.Amount,
						},
					},
				},
				{
					Name: string(bc1.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
			wantCategoryGroupings: ChartDatasets{
				{
					Name: string(bc2.Grouping),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt2.Amount,
						},
					},
				},
				{
					Name: string(bc1.Grouping),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
			wantIncomeExpense: ChartDatasets{
				{
					Name: bt3.Date.YearMonth().StringDash(),
					Values: ChartValues{
						{
							Name:  "total",
							Value: bt3.Amount,
						},
						{
							Name:  "income",
							Value: bt3.Amount,
						},
						{
							Name:  "expense",
							Value: 0,
						},
					},
				},
				{
					Name: bt2.Date.YearMonth().StringDash(),
					Values: ChartValues{
						{
							Name:  "total",
							Value: bt2.Amount + bt3.Amount,
						},
						{
							Name:  "income",
							Value: 0,
						},
						{
							Name:  "expense",
							Value: bt2.Amount * -1,
						},
					},
				},
				{
					Name: bt1.Date.YearMonth().StringDash(),
					Values: ChartValues{
						{
							Name:  "total",
							Value: bt1.Amount + bt2.Amount + bt3.Amount,
						},
						{
							Name:  "income",
							Value: 0,
						},
						{
							Name:  "expense",
							Value: bt1.Amount * -1,
						},
					},
				},
			},
			wantPayees: ChartDatasets{
				{
					Name: string(bp2.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt2.Amount,
						},
					},
				},
				{
					Name: string(ba2.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt4.Amount,
						},
					},
				},
				{
					Name: string(bp1.Name),
					Values: ChartValues{
						{
							Name:  "amount",
							Value: bt1.Amount,
						},
					},
				},
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := ChartDatasetsReadBudgetCategories(ctx, ah.ID, tc.inputFrom, tc.inputTo, false)

			assert.Equal(t, err, nil)
			assert.Equal(t, got, tc.wantCategories)

			got, err = ChartDatasetsReadBudgetCategories(ctx, ah.ID, tc.inputFrom, tc.inputTo, true)

			assert.Equal(t, err, nil)
			assert.Equal(t, got, tc.wantCategoryGroupings)

			got, err = ChartDatasetsReadBudgetIncomeExpense(ctx, ah.ID, tc.inputFrom, tc.inputTo)

			assert.Equal(t, err, nil)
			assert.Equal(t, got, tc.wantIncomeExpense)

			got, err = ChartDatasetsReadBudgetPayees(ctx, ah.ID, tc.inputFrom, tc.inputTo)

			assert.Equal(t, err, nil)
			assert.Equal(t, got, tc.wantPayees)
		})
	}

	ah.Delete(ctx)
}
