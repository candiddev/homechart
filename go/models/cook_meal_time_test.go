package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestCookMealTimeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookMealTimes[0]
	c.Name = "Snack"

	assert.Equal(t, c.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, c.ID != uuid.Nil, true)

	Delete(ctx, &c, DeleteOpts{})
}

func TestCookMealTimeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookMealTimes[0]
	c.Name = "Snack"
	c.create(ctx, CreateOpts{})
	c.Name = "Snack1"
	c.Time, _ = types.ParseCivilTime("20:00")

	assert.Equal(t, c.update(ctx, UpdateOpts{}), nil)

	var meals CookMealTimes

	ReadAll(ctx, &meals, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.CookMealTimes[0].AuthHouseholdID,
				},
			},
		},
	})

	var got CookMealTime

	for _, meal := range meals {
		if meal.ID == c.ID {
			got = meal
		}
	}

	assert.Equal(t, got, c)

	Delete(ctx, &c, DeleteOpts{})
}

func TestCookMealTimesInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testcookmealsinit@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	tests := map[string]struct {
		authAccountID   uuid.UUID
		authHouseholdID uuid.UUID
		err             error
	}{
		"new": {
			authAccountID:   aa.ID,
			authHouseholdID: ah.ID,
		},
		"exists": {
			authAccountID:   seed.AuthAccounts[0].ID,
			authHouseholdID: seed.AuthHouseholds[0].ID,
			err:             errs.ErrSenderConflict,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, CookMealTimesInit(ctx, tc.authHouseholdID, tc.authAccountID), tc.err)
		})
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}
