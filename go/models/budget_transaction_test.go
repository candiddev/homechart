package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetTransactionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	d := types.CivilDateOf(GenerateTimestamp()).AddDays(-50)
	b := seed.BudgetTransactions[0]
	b.Accounts = BudgetTransactionAccounts{
		{
			Amount:          100000,
			BudgetAccountID: &seed.BudgetAccounts[0].ID,
		},
	}
	b.Date = d

	// Get BudgetPayee pre-trigger
	bp := BudgetPayee{
		AuthHouseholdID: b.AuthHouseholdID,
		ID:              *b.BudgetPayeeID,
	}

	Read(ctx, &bp, ReadOpts{})

	assert.Equal(t, b.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, b.ID != nil, true)

	// Test triggers
	// BudgetPayee
	want := bp.BudgetTransactionAmount + b.Amount
	Read(ctx, &bp, ReadOpts{})

	assert.Equal(t, bp.BudgetTransactionAmount, want)
	assert.Equal(t, bp.BudgetCategoryID, b.Categories[0].BudgetCategoryID)

	// Delete and check delete triggers
	month := BudgetMonth{
		AuthHouseholdID: b.AuthHouseholdID,
		YearMonth:       b.Categories[0].YearMonth,
	}
	month.Read(ctx)

	// Deleting the budget_transaction_account should delete the budget_transaction
	Delete(ctx, &b, DeleteOpts{})

	// BudgetMonth
	want = month.BudgetTransactionAmountIncome - b.Amount
	month.Read(ctx)

	assert.Equal(t, month.BudgetTransactionAmountIncome, want)

	// BudgetPayee
	want = bp.BudgetTransactionAmount - b.Amount
	Read(ctx, &bp, ReadOpts{})

	assert.Equal(t, bp.BudgetTransactionAmount, want)
}

func TestBudgetTransactionRead(t *testing.T) {
	logger.UseTestLogger(t)

	b := BudgetTransaction{
		AuthHouseholdID: seed.BudgetTransactions[0].AuthHouseholdID,
		ID:              seed.BudgetTransactions[0].ID,
	}

	assert.Equal(t, b.Read(ctx), nil)
	assert.Equal(t, len(b.Accounts), 1)
}

func TestBudgetTransactionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	d := types.CivilDateOf(GenerateTimestamp()).AddDays(-50)
	bt1o := seed.BudgetTransactions[0]
	bt1o.Accounts = nil
	bt1o.Categories = nil
	bt1o.create(ctx, CreateOpts{})

	bt1n := bt1o
	bt1n.Amount = 11111
	bt1n.BudgetPayeeID = &seed.BudgetPayees[2].ID
	bt1n.Date = d
	bt1n.Note = "New note1"

	bt2o := seed.BudgetTransactions[0]
	bt2o.Accounts = nil
	bt2o.Categories = nil
	bt2o.create(ctx, CreateOpts{})

	bt2n := bt2o
	bt2n.Amount = -1000
	bt2n.BudgetPayeeID = &seed.BudgetPayees[2].ID
	bt2n.Date = d
	bt2n.Note = "New note1"

	// Get BudgetPayee pre-trigger
	bpO := BudgetPayee{
		AuthHouseholdID: bt1o.AuthHouseholdID,
		ID:              *bt1o.BudgetPayeeID,
	}

	bpN := BudgetPayee{
		AuthHouseholdID: bt1n.AuthHouseholdID,
		ID:              *bt1n.BudgetPayeeID,
	}

	Read(ctx, &bpO, ReadOpts{})
	Read(ctx, &bpN, ReadOpts{})

	assert.Equal(t, bt1n.update(ctx, UpdateOpts{}), nil)

	out := BudgetTransaction{
		AuthHouseholdID: bt1n.AuthHouseholdID,
		ID:              bt1n.ID,
	}

	Read(ctx, &out, ReadOpts{})

	assert.Equal(t, out, bt1n)
	assert.Equal(t, bt2n.update(ctx, UpdateOpts{}), nil)

	out = BudgetTransaction{
		AuthHouseholdID: bt2n.AuthHouseholdID,
		ID:              bt2n.ID,
	}
	Read(ctx, &out, ReadOpts{})

	assert.Equal(t, out, bt2n)

	// Test triggers
	// BudgetPayee
	want := bpO.BudgetTransactionAmount - bt1o.Amount - bt2o.Amount
	Read(ctx, &bpO, ReadOpts{})

	assert.Equal(t, bpO.BudgetTransactionAmount, want)

	want = bpN.BudgetTransactionAmount + bt1n.Amount + bt2n.Amount
	Read(ctx, &bpN, ReadOpts{})

	assert.Equal(t, bpN.BudgetTransactionAmount, want)

	Delete(ctx, &bt1n, DeleteOpts{})
	Delete(ctx, &bt2n, DeleteOpts{})
}

func TestBudgetTransactionValidate(t *testing.T) {
	tests := map[string]struct {
		err   error
		input BudgetTransaction
	}{
		"no entries": {
			err:   errs.ErrSenderBadRequest,
			input: BudgetTransaction{},
		},
		"3 accounts": {
			err: ErrBudgetTransactionAccounts,
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 1000,
					},
					{
						Amount: -500,
					},
					{
						Amount: -500,
					},
				},
			},
		},
		"payee without a category": {
			err: ErrBudgetTransactionPayee,
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 1000,
					},
				},
				Amount:        1000,
				BudgetPayeeID: &seed.BudgetPayees[0].ID,
			},
		},
		"payee name without a category": {
			err: ErrBudgetTransactionPayee,
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 1000,
					},
				},
				Amount:          1000,
				BudgetPayeeName: "TEST",
			},
		},
		"account only": {
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 10,
					},
				},
			},
		},
		"account only payee name": {
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 10,
					},
				},
				Amount:          10,
				BudgetPayeeName: "hello",
				Categories: BudgetTransactionCategories{
					{
						Amount: 10,
					},
				},
			},
		},
		"unbalanced category / amount": {
			err: ErrBudgetTransactionBalanceCategoryAmount,
			input: BudgetTransaction{
				Amount: 10,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 20,
					},
				},
				BudgetPayeeID: &seed.BudgetPayees[0].ID,
				Categories: BudgetTransactionCategories{
					{
						Amount: 20,
					},
				},
			},
		},
		"unbalanced accounts": {
			err: ErrBudgetTransactionBalanceAccounts,
			input: BudgetTransaction{
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 20,
					},
					{
						Amount: 20,
					},
				},
			},
		},
		"unbalanced accounts amounts": {
			err: ErrBudgetTransactionBalanceAccounts,
			input: BudgetTransaction{
				Amount: 20,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 20,
					},
					{
						Amount: -20,
					},
				},
			},
		},
		"unbalanced accounts with categories amount": {
			err: ErrBudgetTransactionBalanceAccounts,
			input: BudgetTransaction{
				Amount: 50,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 50,
					},
					{
						Amount: 50,
					},
				},
				Categories: BudgetTransactionCategories{
					{
						Amount: 50,
					},
				},
			},
		},
		"unbalanced accounts category": {
			err: ErrBudgetTransactionBalanceAccountAmount,
			input: BudgetTransaction{
				Amount: 50,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 100,
					},
					{
						Amount: -100,
					},
				},
				Categories: BudgetTransactionCategories{
					{
						Amount: 50,
					},
				},
			},
		},
		"unbalanced accounts category amount": {
			err: ErrBudgetTransactionBalanceCategoryAmount,
			input: BudgetTransaction{
				Amount: 50,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 100,
					},
					{
						Amount: -100,
					},
				},
				Categories: BudgetTransactionCategories{
					{
						Amount: -100,
					},
				},
			},
		},
		"good": {
			input: BudgetTransaction{
				Amount: 50,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 50,
					},
					{
						Amount: -50,
					},
				},
				Categories: BudgetTransactionCategories{
					{
						Amount: 50,
					},
				},
			},
		},
		"category transfers": {
			input: BudgetTransaction{
				Amount: 0,
				Accounts: BudgetTransactionAccounts{
					{
						Amount: 0,
					},
				},
				Categories: BudgetTransactionCategories{
					{
						Amount: -100,
					},
					{
						Amount: 100,
					},
				},
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.input.Validate(), tc.err)
		})
	}
}

func TestBudgetTransactionsRead(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 51; i++ {
		bt := seed.BudgetTransactions[2]
		d := types.CivilDateOf(GenerateTimestamp()).AddDays(-5)
		bt.Date = d
		bt.create(ctx, CreateOpts{})
	}

	bt := seed.BudgetTransactions[2]
	d := types.CivilDateOf(GenerateTimestamp()).AddDays(-4)
	bt.Date = d
	bt.create(ctx, CreateOpts{})

	// Test ReadAccount
	out1, total, err := BudgetTransactionsReadAccount(ctx, *seed.BudgetTransactions[2].Accounts[0].BudgetAccountID, 0, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 58)
	assert.Equal(t, len(out1), 50)

	out2, total, err := BudgetTransactionsReadAccount(ctx, *seed.BudgetTransactions[2].Accounts[0].BudgetAccountID, 50, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 58)
	assert.Equal(t, len(out2), 8)

	out := append(out1, out2...) //nolint:gocritic

	for _, transaction := range out {
		if transaction.ID == bt.ID {
			assert.Equal(t, transaction.Amount, -10000)
			assert.Equal(t, transaction.Balance, -520000)
			assert.Equal(t, len(transaction.Accounts), 1)
			assert.Equal(t, len(transaction.Categories), 2)
		}
	}

	// Test ReadCategory
	out1, total, err = BudgetTransactionsReadCategory(ctx, *seed.BudgetTransactions[2].Categories[0].BudgetCategoryID, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 54)
	assert.Equal(t, len(out1), 50)

	out2, total, err = BudgetTransactionsReadCategory(ctx, *seed.BudgetTransactions[2].Categories[0].BudgetCategoryID, 50)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 54)
	assert.Equal(t, len(out2), 4)
	out = append(out1, out2...) //nolint:gocritic

	for _, transaction := range out {
		if transaction.ID == bt.ID {
			assert.Equal(t, transaction.Amount, -10000)
			assert.Equal(t, transaction.Balance, -260000)
			assert.Equal(t, len(transaction.Accounts), 1)
			assert.Equal(t, len(transaction.Categories), 2)
		}
	}

	// Test ReadCategoryMonth
	out1, total, err = BudgetTransactionsReadCategoryMonth(ctx, *seed.BudgetTransactions[2].Categories[0].BudgetCategoryID, seed.BudgetTransactions[2].Categories[0].YearMonth, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 53)
	assert.Equal(t, len(out1), 50)

	out2, total, err = BudgetTransactionsReadCategoryMonth(ctx, *seed.BudgetTransactions[2].Categories[0].BudgetCategoryID, seed.BudgetTransactions[2].Categories[0].YearMonth, 50)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 53)
	assert.Equal(t, len(out2), 3)

	out = append(out1, out2...) //nolint:gocritic

	for _, transaction := range out {
		if transaction.ID == bt.ID {
			assert.Equal(t, transaction.Amount, -10000)
			assert.Equal(t, transaction.Balance, -260000)
			assert.Equal(t, len(transaction.Accounts), 1)
			assert.Equal(t, len(transaction.Categories), 2)
		}
	}

	// Test ReadPayee
	out1, total, err = BudgetTransactionsReadPayee(ctx, *seed.BudgetTransactions[2].BudgetPayeeID, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 54)
	assert.Equal(t, len(out1), 50)

	out2, total, err = BudgetTransactionsReadPayee(ctx, *seed.BudgetTransactions[2].BudgetPayeeID, 50)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 54)
	assert.Equal(t, len(out2), 4)

	out = append(out1, out2...) //nolint:gocritic

	for _, transaction := range out {
		if transaction.ID == bt.ID {
			assert.Equal(t, transaction.Amount, -10000)
			assert.Equal(t, transaction.Balance, -520000)
			assert.Equal(t, len(transaction.Accounts), 1)
			assert.Equal(t, len(transaction.Categories), 2)
		}
	}

	for _, transaction := range out {
		if types.CivilDateOf(GenerateTimestamp()).AddDays(-3).After(transaction.Date) {
			Delete(ctx, &transaction, DeleteOpts{})
		}
	}
}

func TestBudgetTransactionsRollup(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]int{
		"balance": c.App.RollupBudgetTransactionsBalanceMonths,
		"summary": c.App.RollupBudgetTransactionsSummaryMonths,
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			ah := seed.AuthHouseholds[0]
			ah.Create(ctx, false)

			bp := seed.BudgetPayees[0]
			bp.AuthHouseholdID = ah.ID
			bp.create(ctx, CreateOpts{})

			ba1 := seed.BudgetAccounts[0]
			ba1.AuthHouseholdID = ah.ID
			ba1.create(ctx, CreateOpts{})

			ba2 := seed.BudgetAccounts[1]
			ba2.AuthHouseholdID = ah.ID
			ba2.create(ctx, CreateOpts{})

			ba3 := seed.BudgetAccounts[0]
			ba3.Name = "Extra"
			ba3.AuthHouseholdID = ah.ID
			ba3.create(ctx, CreateOpts{})

			bc1 := seed.BudgetCategories[0]
			bc1.AuthHouseholdID = ah.ID
			bc1.create(ctx, CreateOpts{})

			bc2 := seed.BudgetCategories[1]
			bc2.AuthHouseholdID = ah.ID
			bc2.create(ctx, CreateOpts{})

			_, btac1, _ := BudgetTransactionsReadAccount(ctx, ba1.ID, 0, 0)
			_, btcc1, _ := BudgetTransactionsReadCategory(ctx, bc1.ID, 0)

			d := types.CivilDateToday().AddMonths(-1 * (tc + 1))
			d.Day = 28

			for i := 1; i <= 60; i++ {
				switch i {
				case 21:
					bt := BudgetTransaction{
						Accounts: BudgetTransactionAccounts{
							{
								Amount:          100000,
								BudgetAccountID: &ba1.ID,
							},
						},
						Amount:          100000,
						AuthHouseholdID: ah.ID,
						BudgetPayeeID:   &bp.ID,
						Categories: BudgetTransactionCategories{
							{
								Amount:           100000,
								BudgetCategoryID: &bc1.ID,
								YearMonth:        d.YearMonth(),
							},
						},
						Date: d,
						Keep: true,
					}
					bt.create(ctx, CreateOpts{})

					fallthrough
				case 41:
					d.Day = 28
					d = d.AddMonths(-1)
				default:
					d = d.AddDays(-1)
				}

				bt1 := BudgetTransaction{
					Accounts: BudgetTransactionAccounts{
						{
							Amount:          200000,
							BudgetAccountID: &ba1.ID,
						},
						{
							Amount:          -200000,
							BudgetAccountID: &ba2.ID,
						},
					},
					Amount:          200000,
					AuthHouseholdID: ah.ID,
					BudgetPayeeID:   &bp.ID,
					Categories: BudgetTransactionCategories{
						{
							Amount:           100000,
							BudgetCategoryID: &bc1.ID,
							YearMonth:        d.YearMonth(),
						},
						{
							Amount:           100000,
							BudgetCategoryID: &bc2.ID,
							YearMonth:        d.YearMonth(),
						},
					},
					Date: d,
				}
				logger.Error(ctx, bt1.Validate())
				assert.Equal(t, bt1.Validate(), nil)
				bt1.create(ctx, CreateOpts{})

				bt2 := BudgetTransaction{
					Accounts: BudgetTransactionAccounts{
						{
							Amount:          -200000,
							BudgetAccountID: &ba1.ID,
						},
						{
							Amount:          200000,
							BudgetAccountID: &ba3.ID,
						},
					},
					Amount:          0,
					AuthHouseholdID: ah.ID,
					Date:            d,
				}
				bt2.create(ctx, CreateOpts{})
				assert.Equal(t, bt2.Validate(), nil)
			}

			ba1o := ba1
			Read(ctx, &ba1o, ReadOpts{})

			ba2o := ba2
			Read(ctx, &ba2o, ReadOpts{})

			ba3o := ba3
			Read(ctx, &ba3o, ReadOpts{})

			bc1o := bc1
			Read(ctx, &bc1o, ReadOpts{})

			var added int

			var deleted int

			var want int

			if name == "balance" {
				added, deleted = BudgetTransactionsRollupBalance(ctx)
				want = 1
			} else {
				added, deleted = BudgetTransactionsRollupSummary(ctx)
				want = 6
			}

			assert.Equal(t, added, want)
			assert.Equal(t, deleted, 120)

			ba1n := ba1
			Read(ctx, &ba1n, ReadOpts{})

			assert.Equal(t, ba1n.BudgetTransactionAmount, ba1o.BudgetTransactionAmount)

			ba2n := ba2
			Read(ctx, &ba2n, ReadOpts{})

			assert.Equal(t, ba2n.BudgetTransactionAmount, ba2o.BudgetTransactionAmount)

			ba3n := ba3
			Read(ctx, &ba3n, ReadOpts{})

			assert.Equal(t, ba3n.BudgetTransactionAmount, ba3o.BudgetTransactionAmount)

			_, btac2, _ := BudgetTransactionsReadAccount(ctx, ba1.ID, 0, 0)

			if name == "balance" {
				want = btac1 + 1
			} else {
				want = btac1 + 3 + 4
			}

			assert.Equal(t, btac2, want)

			bc1n := bc1
			Read(ctx, &bc1n, ReadOpts{})

			assert.Equal(t, bc1n.BudgetTransactionAmount, bc1o.BudgetTransactionAmount)

			_, btcc2, _ := BudgetTransactionsReadCategory(ctx, bc1.ID, 0)

			if name == "balance" {
				want = btcc1 + 1 + 1
			} else {
				want = btcc1 + 3 + 1
			}

			assert.Equal(t, btcc2, want)

			if name == "balance" {
				added, deleted = BudgetTransactionsRollupBalance(ctx)
			} else {
				added, deleted = BudgetTransactionsRollupSummary(ctx)
			}

			assert.Equal(t, added, 0)
			assert.Equal(t, deleted, 0)

			ah.Delete(ctx)
		})
	}
}
