package controllers

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestBudgetTransactionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.BudgetTransactions[0]
	noDate := seed.BudgetTransactions[0]
	noDate.Date = types.CivilDate{}
	tests := map[string]struct {
		err         string
		transaction models.BudgetTransaction
	}{
		"missing date": {
			err:         errs.ErrSenderBadRequest.Message(),
			transaction: noDate,
		},
		"good": {
			transaction: good,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetTransactions

			r := request{
				data:         tc.transaction,
				method:       "POST",
				responseType: &b,
				session:      seed.AuthSessions[0],
				uri:          "/budget/transactions",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, b[0].ID != nil, true)

				b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
				models.Delete(ctx, &b[0], models.DeleteOpts{})
			}
		})
	}
}

func TestBudgetTransactionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.BudgetTransactions[0]
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/budget/transactions/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBudgetTransactionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetTransactions[0]
	b.Accounts = models.BudgetTransactionAccounts{
		models.BudgetTransactionAccount{
			Amount:          100000,
			BudgetAccountID: &seed.BudgetAccounts[0].ID,
		},
	}
	b.Categories = models.BudgetTransactionCategories{
		models.BudgetTransactionCategory{
			Amount:           100000,
			BudgetCategoryID: &seed.BudgetCategories[0].ID,
			YearMonth:        seed.BudgetTransactions[0].Categories[0].YearMonth,
		},
	}
	models.Create(ctx, &b, models.CreateOpts{})
	noDate := b
	noDate.Date = types.CivilDate{}
	bn := b
	bn.Amount = 150000
	bn.Date = b.Date.AddDays(10)
	bn.Categories = models.BudgetTransactionCategories{
		models.BudgetTransactionCategory{
			Amount:           150000,
			BudgetCategoryID: &seed.BudgetCategories[0].ID,
			YearMonth:        seed.BudgetTransactions[0].Categories[0].YearMonth,
		},
	}
	bn.Accounts = models.BudgetTransactionAccounts{
		models.BudgetTransactionAccount{
			Amount:          150000,
			BudgetAccountID: &seed.BudgetAccounts[1].ID,
			ID:              b.Accounts[0].ID,
		},
		models.BudgetTransactionAccount{
			Amount:          -150000,
			BudgetAccountID: &seed.BudgetAccounts[0].ID,
		},
	}

	newNoCategories := bn
	newNoCategories.Amount = 0
	newNoCategories.BudgetPayeeID = nil
	newNoCategories.Categories = models.BudgetTransactionCategories{}
	tests := []struct {
		err         string
		name        string
		transaction models.BudgetTransaction
		uri         string
	}{
		{
			name:        "invalid id",
			err:         errs.ErrSenderBadRequest.Message(),
			transaction: bn,
			uri:         "/budget/transactions/aaa",
		},
		{
			name:        "missing date",
			err:         errs.ErrSenderBadRequest.Message(),
			transaction: noDate,
			uri:         "/budget/transactions/" + b.ID.String(),
		},
		{
			name:        "good",
			transaction: bn,
			uri:         "/budget/transactions/" + b.ID.String(),
		},
		{
			name:        "good - no categories",
			transaction: newNoCategories,
			uri:         "/budget/transactions/" + b.ID.String(),
		},
		{
			name:        "good - add categories back",
			transaction: bn,
			uri:         "/budget/transactions/" + b.ID.String(),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := request{
				data:    tc.transaction,
				method:  "PUT",
				session: seed.AuthSessions[0],
				uri:     tc.uri,
			}

			assert.Equal(t, r.do().Error(), tc.err)

			n := models.BudgetTransaction{
				AuthHouseholdID: tc.transaction.AuthHouseholdID,
				ID:              tc.transaction.ID,
			}
			n.Read(ctx)

			switch tc.name {
			case "good":
				assert.Equal(t, n.Categories[0].YearMonth, bn.Categories[0].YearMonth)
				assert.Equal(t, n.Accounts[1].ID != uuid.Nil, true)
				assert.Equal(t, n.Categories[0].ID != uuid.Nil, true)
			case "good - no categories":
				assert.Equal(t, len(n.Categories), 0)
			case "good - add categories back":
				assert.Equal(t, len(n.Categories), len(bn.Categories))
			}
		})
	}

	models.Delete(ctx, &b, models.DeleteOpts{})
}

func TestBudgetTransactionsRead(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		offset int
		uri    string
		want   int
	}{
		"account - all": {
			offset: 0,
			uri:    fmt.Sprintf("/budget/accounts/%s/transactions", seed.BudgetAccounts[0].ID.String()),
			want:   6,
		},
		"account - offset": {
			offset: 2,
			uri:    fmt.Sprintf("/budget/accounts/%s/transactions", seed.BudgetAccounts[0].ID.String()),
			want:   4,
		},
		"category - all": {
			offset: 0,
			uri:    fmt.Sprintf("/budget/categories/%s/transactions", seed.BudgetCategories[1].ID.String()),
			want:   2,
		},
		"category - offset": {
			offset: 1,
			uri:    fmt.Sprintf("/budget/categories/%s/transactions", seed.BudgetCategories[1].ID.String()),
			want:   1,
		},
		"category month - all": {
			offset: 0,
			uri:    fmt.Sprintf("/budget/categories/%s/transactions/%d", seed.BudgetCategories[1].ID.String(), seed.BudgetTransactions[0].Categories[0].YearMonth),
			want:   1,
		},
		"category month - offset": {
			offset: 1,
			uri:    fmt.Sprintf("/budget/categories/%s/transactions/%d", seed.BudgetCategories[1].ID.String(), seed.BudgetTransactions[0].Categories[0].YearMonth),
			want:   0,
		},
		"payee - all": {
			offset: 0,
			uri:    fmt.Sprintf("/budget/payees/%s/transactions", seed.BudgetTransactions[1].BudgetPayeeID),
			want:   2,
		},
		"payee - offset": {
			offset: 1,
			uri:    fmt.Sprintf("/budget/payees/%s/transactions", seed.BudgetTransactions[1].BudgetPayeeID),
			want:   1,
		},
	}
	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetTransactions

			r := request{
				offset:       tc.offset,
				method:       "GET",
				responseType: &b,
				session:      seed.AuthSessions[0],
				uri:          tc.uri,
			}

			msg := r.do()

			noError(t, msg)
			assert.Equal(t, len(b), tc.want)
			assert.Equal(t, msg.DataTotal != 0, true)
		})
	}
}
