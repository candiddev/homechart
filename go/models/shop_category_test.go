package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

func TestShopCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopCategories[0]
	s.Name = "create"

	assert.Equal(t, s.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, s.ID != seed.ShopCategories[0].ID, true)

	Delete(ctx, &s, DeleteOpts{})
}

func TestShopCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopCategories[0]
	s.Name = "update"
	s.create(ctx, CreateOpts{})
	s.Match = "111"
	s.Name = "update2"
	s.BudgetPayeeID = &seed.BudgetPayees[1].ID
	assert.Equal(t, s.update(ctx, UpdateOpts{}), nil)

	category := ShopCategory{
		AuthHouseholdID: s.AuthHouseholdID,
		ID:              s.ID,
	}

	Read(ctx, &category, ReadOpts{})

	assert.Equal(t, category, s)

	Delete(ctx, &s, DeleteOpts{})
}

func TestShopCategoriesInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := AuthAccount{
		EmailAddress: "testshopcategoriesinit@example.com",
		Password:     "a",
	}
	aa.Create(ctx, false)

	tests := []error{
		nil,
		errs.ErrClientConflictExists,
	}

	for _, tc := range tests {
		assert.HasErr(t, ShopCategoriesInit(ctx, ah.ID, aa.ID), tc)
	}

	ah.Delete(ctx)
}
