package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestShopListCreate(t *testing.T) {
	logger.UseTestLogger(t)

	s1 := seed.ShopLists[0]
	s1.ID = uuid.Nil
	s1.Name = "create"

	assert.Equal(t, s1.create(ctx, CreateOpts{}), nil)

	s2 := ShopList{
		AuthAccountID: s1.AuthAccountID,
		ID:            s1.ID,
	}

	Read(ctx, &s2, ReadOpts{})

	assert.Equal(t, s2, s1)

	Delete(ctx, &s1, DeleteOpts{})

	s1.AuthAccountID = nil
	s1.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	s1.ID = uuid.UUID{}
	s1.create(ctx, CreateOpts{})

	// Should fail due to duplicate name
	s1 = seed.ShopLists[0]

	assert.HasErr(t, s1.create(ctx, CreateOpts{}), errs.ErrClientConflictExists)

	// Increment short ID
	id := types.NewNanoid()
	s1 = seed.ShopLists[0]
	s1.ID = uuid.UUID{}
	s1.Name = "testing"
	s1.ShortID = id

	assert.Equal(t, s1.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, s1.ShortID, id)

	Delete(ctx, &s1, DeleteOpts{})
}

func TestShopListUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopLists[0]
	s.AuthAccountID = nil
	s.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	s.ID = uuid.Nil
	s.Name = "update"
	s.create(ctx, CreateOpts{})

	si := ShopItem{
		AuthHouseholdID: s.AuthHouseholdID,
		Name:            "s",
		ShopListID:      &s.ID,
	}
	si.create(ctx, CreateOpts{})

	s.AuthAccountID = &seed.AuthAccounts[0].ID
	s.AuthHouseholdID = nil
	s.Name = "update1"
	opts := UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}

	assert.Equal(t, s.update(ctx, opts), nil)

	list := ShopList{
		AuthAccountID:   s.AuthAccountID,
		AuthHouseholdID: s.AuthHouseholdID,
		ID:              s.ID,
	}

	Read(ctx, &list, ReadOpts{})

	assert.Equal(t, list, s)

	si.AuthAccountID = s.AuthAccountID

	assert.HasErr(t, Read(ctx, &si, ReadOpts{}), nil)
	assert.Equal(t, si.AuthAccountID, &seed.AuthAccounts[0].ID)
	assert.Equal(t, si.AuthHouseholdID, nil)

	Delete(ctx, &s, DeleteOpts{})
	Delete(ctx, &si, DeleteOpts{})
}

func TestShopListsInitHousehold(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	assert.Equal(t, ShopListsInitHousehold(ctx, ah.ID), nil)

	var lists ShopLists

	ReadAll(ctx, &lists, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(lists), 1)

	ah.Delete(ctx)
}

func TestShopListsInitPersonal(t *testing.T) {
	logger.UseTestLogger(t)

	aa := AuthAccount{
		EmailAddress: "shoplistsinit@example.com",
	}
	aa.Create(ctx, false)

	assert.Equal(t, ShopListsInitPersonal(ctx, aa.ID), nil)

	var lists ShopLists

	ReadAll(ctx, &lists, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(lists), 1)

	aa.Delete(ctx)
}
