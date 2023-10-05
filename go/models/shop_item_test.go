package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestShopItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	list := seed.ShopLists[0]

	Read(ctx, &list, ReadOpts{})

	project := seed.PlanProjects[5]

	Read(ctx, &project, ReadOpts{})

	today := types.CivilDateOf(GenerateTimestamp())

	s := seed.ShopItems[0]
	s.AuthAccountID = nil
	s.AuthHouseholdID = nil
	s.Name = "create"
	s.NextDate = &today
	s.PlanProjectID = &project.ID
	s.Recurrence = &types.Recurrence{
		Separation: 1,
	}
	s.Position = "8"
	s.ShopListID = &seed.ShopLists[0].ID

	assert.Equal(t, s.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, s.ID != seed.ShopItems[0].ID, true)
	assert.Equal(t, seed.ShopLists[0].AuthAccountID, s.AuthAccountID)
	assert.Equal(t, s.AuthHouseholdID, nil)

	want := list.ShopItemCount + 1

	Read(ctx, &list, ReadOpts{})

	assert.Equal(t, list.ShopItemCount, want)

	want = project.ShopItemCount + 1
	Read(ctx, &project, ReadOpts{})

	assert.Equal(t, project.ShopItemCount, want)

	Delete(ctx, &s, DeleteOpts{})

	s.AuthAccountID = &seed.AuthAccounts[0].ID
	s.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	err := s.create(ctx, CreateOpts{})
	assert.HasErr(t, err, error(errs.ErrSenderBadRequest))
}

func TestShopItemDelete(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopItems[0]
	s.Name = "create"
	s.ShopListID = &seed.ShopLists[2].ID
	s.Position = "12"
	s.PlanProjectID = &seed.PlanProjects[5].ID
	s.create(ctx, CreateOpts{})

	list := seed.ShopLists[2]

	Read(ctx, &list, ReadOpts{})

	project := seed.PlanProjects[5]

	Read(ctx, &project, ReadOpts{})

	assert.Equal(t, Delete(ctx, &s, DeleteOpts{}), nil)

	want := list.ShopItemCount - 1

	Read(ctx, &list, ReadOpts{})

	assert.Equal(t, list.ShopItemCount, want)

	want = project.ShopItemCount - 1

	Read(ctx, &project, ReadOpts{})

	assert.Equal(t, project.ShopItemCount, want)
}

func TestShopItemUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	si1 := seed.ShopItems[0]
	si1.Name = "update"
	si1.Position = "10"
	si1.ShopListID = &seed.ShopLists[2].ID
	si1.PlanProjectID = &seed.PlanProjects[5].ID
	si1.create(ctx, CreateOpts{})

	sl1 := seed.ShopLists[0]

	Read(ctx, &sl1, ReadOpts{})

	sl2 := seed.ShopLists[2]

	Read(ctx, &sl2, ReadOpts{})

	pp1 := seed.PlanProjects[5]

	Read(ctx, &pp1, ReadOpts{})

	pp2 := seed.PlanProjects[0]

	Read(ctx, &pp2, ReadOpts{})

	today := types.CivilDateOf(GenerateTimestamp())

	si2 := si1
	si2.AuthAccountID = &seed.AuthAccounts[0].ID
	si2.AuthHouseholdID = nil
	si2.InCart = true
	si2.Name = "update2"
	si2.ShopCategoryID = &seed.ShopCategories[1].ID
	si2.ShopListID = &sl1.ID
	si2.NextDate = &today
	si2.PlanProjectID = &pp2.ID
	si2.Position = "2"
	si2.Recurrence = &types.Recurrence{
		Separation: 1,
	}

	assert.Equal(t, si2.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	item := ShopItem{
		AuthAccountID:   si2.AuthAccountID,
		AuthHouseholdID: si2.AuthHouseholdID,
		ID:              si2.ID,
	}

	Read(ctx, &item, ReadOpts{})

	assert.Equal(t, item, si2)

	want := sl1.ShopItemCount + 1
	Read(ctx, &sl1, ReadOpts{})

	assert.Equal(t, sl1.ShopItemCount, want)

	want = sl2.ShopItemCount - 1
	Read(ctx, &sl2, ReadOpts{})

	assert.Equal(t, sl2.ShopItemCount, want)

	want = pp1.ShopItemCount - 1
	Read(ctx, &pp1, ReadOpts{})

	assert.Equal(t, pp1.ShopItemCount, want)

	want = pp2.ShopItemCount + 1
	Read(ctx, &pp2, ReadOpts{})

	assert.Equal(t, pp2.ShopItemCount, want)

	Delete(ctx, &si2, DeleteOpts{})
}

func TestShopItemsReadAssistant(t *testing.T) {
	logger.UseTestLogger(t)

	got, _, list := ShopItemsReadAssistant(ctx, PermissionsOpts{
		AuthAccountID:          &seed.AuthAccounts[0].ID,
		AuthAccountPermissions: &Permissions{},
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
			},
		},
	}, string(seed.BudgetPayees[1].Name))

	assert.Contains(t, got, "I found 3 shopping items from Jane's General Store: 1 loaf sourdough bread, 2 1/2 cups wide egg noodles, and Broom.")
	assert.Equal(t, len(list), 3)
}
