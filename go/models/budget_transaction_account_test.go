package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestBudgetTransactionAccountReconcile(t *testing.T) {
	logger.UseTestLogger(t)

	ba := seed.BudgetAccounts[0]
	ba.Name = "test"
	ba.create(ctx, CreateOpts{})

	bt1 := seed.BudgetTransactions[0].Accounts[0]
	bt1.BudgetAccountID = &ba.ID
	bt1.create(ctx, CreateOpts{})

	bt2 := bt1
	bt2.create(ctx, CreateOpts{})

	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmountCleared, 0)
	assert.Equal(t, ba.BudgetTransactionAmountReconciled, 0)
	assert.Equal(t, ba.BudgetTransactionAmount, bt1.Amount*2)

	bt1.Status = BudgetTransactionAccountStatusCleared
	bt1.update(ctx, UpdateOpts{})
	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmountCleared, bt1.Amount)
	assert.Equal(t, ba.BudgetTransactionAmountReconciled, 0)

	assert.Equal(t, BudgetTransactionAccountsReconcile(ctx, PermissionsOpts{
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
			},
		},
	}, ba.ID), nil)

	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmountCleared, bt1.Amount)
	assert.Equal(t, ba.BudgetTransactionAmountReconciled, bt1.Amount)

	Delete(ctx, &ba, DeleteOpts{})
}

func TestBudgetTransactionAccountCreate(t *testing.T) {
	logger.UseTestLogger(t)

	bta1 := seed.BudgetTransactions[0].Accounts[0]
	bta1.Amount = -2000
	bta1.Status = BudgetTransactionAccountStatusReconciled
	bta2 := seed.BudgetTransactions[0].Accounts[0]
	bta2.Amount = 3000
	bta2.Status = BudgetTransactionAccountStatusCleared

	// Get BudgetAccount pre-trigger
	var ba BudgetAccount

	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, bta1.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, bta2.create(ctx, CreateOpts{}), nil)

	// Test triggers
	// BudgetAccount
	want := ba.BudgetTransactionAmount + bta1.Amount + bta2.Amount + ba.BudgetTransactionAmountCleared + bta1.Amount + bta2.Amount + ba.BudgetTransactionAmountReconciled + bta1.Amount
	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmount+ba.BudgetTransactionAmountCleared+ba.BudgetTransactionAmountReconciled, want)

	// Delete and check delete triggers
	Delete(ctx, &bta1, DeleteOpts{})
	Delete(ctx, &bta2, DeleteOpts{})

	// BudgetAccount
	want = ba.BudgetTransactionAmount - bta1.Amount - bta2.Amount + ba.BudgetTransactionAmountCleared - bta1.Amount - bta2.Amount + ba.BudgetTransactionAmountReconciled - bta1.Amount
	Read(ctx, &ba, ReadOpts{})

	assert.Equal(t, ba.BudgetTransactionAmount+ba.BudgetTransactionAmountCleared+ba.BudgetTransactionAmountReconciled, want)
}

func TestBudgetTransactionAccountUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	bta1o := seed.BudgetTransactions[0].Accounts[0]
	bta1o.Amount = -2000
	bta1o.Status = BudgetTransactionAccountStatusReconciled
	bta1o.create(ctx, CreateOpts{})

	bta1n := bta1o
	bta1n.Amount = -3000
	bta1n.BudgetAccountID = &seed.BudgetAccounts[1].ID
	bta1n.Status = BudgetTransactionStatusUncleared

	bta2o := seed.BudgetTransactions[0].Accounts[0]
	bta2o.Amount = 3000
	bta2o.Status = BudgetTransactionAccountStatusCleared
	bta2o.create(ctx, CreateOpts{})

	bta2n := bta2o
	bta2n.Amount = 4000
	bta2n.BudgetAccountID = &seed.BudgetAccounts[1].ID
	bta2n.Status = BudgetTransactionAccountStatusCleared

	// Get BudgetAccounts pre-trigger
	bao := BudgetAccount{
		AuthHouseholdID: bta1o.AuthHouseholdID,
		ID:              *bta1o.BudgetAccountID,
	}

	ban := BudgetAccount{
		AuthHouseholdID: bta1n.AuthHouseholdID,
		ID:              *bta1n.BudgetAccountID,
	}

	Read(ctx, &bao, ReadOpts{})
	Read(ctx, &ban, ReadOpts{})

	assert.Equal(t, bta1n.update(ctx, UpdateOpts{}), nil)

	out := BudgetTransactionAccount{
		AuthHouseholdID: bta1n.AuthHouseholdID,
		ID:              bta1n.ID,
	}

	Read(ctx, &out, ReadOpts{})

	assert.Equal(t, out, bta1n)
	assert.Equal(t, bta2n.update(ctx, UpdateOpts{}), nil)

	out = BudgetTransactionAccount{
		AuthHouseholdID: bta2n.AuthHouseholdID,
		ID:              bta2n.ID,
	}
	Read(ctx, &out, ReadOpts{})

	assert.Equal(t, out, bta2n)
	// BudgetAccount
	want := bao.BudgetTransactionAmount - bta1o.Amount - bta2o.Amount + bao.BudgetTransactionAmountCleared - bta1o.Amount - bta2o.Amount + bao.BudgetTransactionAmountReconciled - bta1o.Amount
	Read(ctx, &bao, ReadOpts{})

	assert.Equal(t, bao.BudgetTransactionAmount+bao.BudgetTransactionAmountCleared+bao.BudgetTransactionAmountReconciled, want)

	want = ban.BudgetTransactionAmount + bta1n.Amount + bta2n.Amount + ban.BudgetTransactionAmountCleared + bta2n.Amount + ban.BudgetTransactionAmountReconciled
	Read(ctx, &ban, ReadOpts{})

	assert.Equal(t, ban.BudgetTransactionAmount+ban.BudgetTransactionAmountCleared+ban.BudgetTransactionAmountReconciled, want)

	Delete(ctx, &bta1n, DeleteOpts{})
	Delete(ctx, &bta2n, DeleteOpts{})
}
