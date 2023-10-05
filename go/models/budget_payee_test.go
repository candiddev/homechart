package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetPayeeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetPayees[0]
	b.BudgetCategoryID = &seed.BudgetCategories[0].ID
	b.Icon = "icon"
	b.Name = "Test"

	assert.Equal(t, b.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, b.ID != seed.BudgetPayees[0].ID, true)

	// Attempt to recreate, should return the same value
	bn := b

	assert.Equal(t, bn.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, bn, b)

	Delete(ctx, &b, DeleteOpts{})

	// Existing short ID
	id := types.NewNanoid()
	b = seed.BudgetPayees[0]
	b.Name = "create"
	b.ShortID = id

	assert.Equal(t, b.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, b.ShortID, id)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetPayeeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetPayees[0]
	b.Name = "test"
	b.create(ctx, CreateOpts{})
	b.Address = "Some address"
	b.BudgetCategoryID = &seed.BudgetCategories[2].ID
	b.Icon = "icon"
	b.Name = "test2"

	assert.Equal(t, b.update(ctx, UpdateOpts{}), nil)

	payee := BudgetPayee{
		AuthHouseholdID: b.AuthHouseholdID,
		ID:              b.ID,
	}

	Read(ctx, &payee, ReadOpts{})

	assert.Equal(t, payee, b)

	Delete(ctx, &b, DeleteOpts{})
}

func TestBudgetPayeeUpdateBudgetCategoryID(t *testing.T) {
	logger.UseTestLogger(t)

	b1 := seed.BudgetPayees[0]
	b1.BudgetCategoryID = nil
	b1.Name = "test"
	b1.create(ctx, CreateOpts{})
	b1.BudgetCategoryID = &seed.BudgetCategories[1].ID

	assert.Equal(t, b1.UpdateBudgetCategoryID(ctx), nil)

	b2 := BudgetPayee{
		AuthHouseholdID: b1.AuthHouseholdID,
		ID:              b1.ID,
	}

	Read(ctx, &b2, ReadOpts{})

	assert.Equal(t, b1.BudgetCategoryID, b2.BudgetCategoryID)

	b1.BudgetCategoryID = &seed.BudgetCategories[0].ID

	assert.Equal[error](t, b1.UpdateBudgetCategoryID(ctx), errs.ErrSenderNoContent)

	Delete(ctx, &b1, DeleteOpts{})
}

func TestBudgetPayeesDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	ba := BudgetAccount{ // This creates a payee, starting balance
		AuthHouseholdID: ah.ID,
		Name:            "a",
	}
	ba.create(ctx, CreateOpts{})

	bp1 := BudgetPayee{
		AuthHouseholdID: ah.ID,
		Name:            "b",
		ShopStore:       true,
	}
	bp1.create(ctx, CreateOpts{})

	bp2 := BudgetPayee{
		AuthHouseholdID: ah.ID,
		Name:            "c",
	}
	bp2.create(ctx, CreateOpts{})

	var bp BudgetPayees

	ahp := &AuthHouseholdsPermissions{
		{
			AuthHouseholdID: ah.ID,
		},
	}

	ReadAll(ctx, &bp, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	})

	assert.Equal(t, len(bp), 3)

	BudgetPayeesDelete(ctx)

	bp = BudgetPayees{}

	ReadAll(ctx, &bp, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: ahp,
		},
	})

	assert.Equal(t, len(bp), 2)

	ah.Delete(ctx)
}
