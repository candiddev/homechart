package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestHealthItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthItems[0]
	i.Correlations = nil
	i.Color = types.ColorPink
	i.Name = "test"
	i.Output = true

	assert.Equal(t, i.create(ctx, CreateOpts{}), nil)

	ii := HealthItem{
		AuthAccountID: i.AuthAccountID,
		ID:            i.ID,
	}

	Read(ctx, &ii, ReadOpts{})

	assert.Equal(t, i, ii)
	assert.Equal(t, i.create(ctx, CreateOpts{}), nil)

	Delete(ctx, &i, DeleteOpts{})
}

func TestHealthItemUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	hi1o := seed.HealthItems[0]
	hi1o.Correlations = nil
	hi1o.Name = "test1"
	hi1o.Output = false
	hi1o.create(ctx, CreateOpts{})

	hl := HealthLog{
		AuthAccountID: hi1o.AuthAccountID,
		HealthItemID:  hi1o.ID,
	}

	hi1n := hi1o
	hi1n.Color = types.ColorWhite
	hi1n.Name = "test123"
	hi1n.Output = true

	hi2o := seed.HealthItems[3]
	hi2o.Correlations = nil
	hi2o.Name = "test2"
	hi2o.create(ctx, CreateOpts{})

	hi2n := hi2o
	hi2n.Color = types.ColorPurple
	hi2n.Name = "test1234"

	tests := map[string]struct {
		authHouseholdID uuid.UUID
		err             error
		healthItem      *HealthItem
	}{
		"personal": {
			authHouseholdID: uuid.UUID{},
			healthItem:      &hi1n,
		},
		"personal not admin": {
			authHouseholdID: uuid.UUID{},
			err:             errs.ErrSenderNoContent,
			healthItem:      &hi2n,
		},
		"household": {
			authHouseholdID: seed.AuthHouseholds[0].ID,
			healthItem:      &hi2n,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.healthItem.update(ctx, UpdateOpts{
				PermissionsOpts: PermissionsOpts{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: tc.authHouseholdID,
						},
					},
				},
			}), tc.err)

			if tc.err == nil {
				h := HealthItem{
					AuthAccountID: seed.AuthAccounts[0].ID,
					ID:            tc.healthItem.ID,
				}
				Read(ctx, &h, ReadOpts{
					PermissionsOpts{
						AuthAccountID:          &seed.AuthAccounts[0].ID,
						AuthAccountPermissions: &Permissions{},
						AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
							{
								AuthHouseholdID: tc.authHouseholdID,
							},
						},
					},
				})

				assert.Equal(t, h, *tc.healthItem)
			}

			if name == "personal" {
				assert.HasErr(t, Read(ctx, &hl, ReadOpts{}), errs.ErrSenderNotFound)
			}
		})
	}
}

func TestHealthItemsInit(t *testing.T) {
	logger.UseTestLogger(t)

	aa := AuthAccount{
		EmailAddress: "healthitemsinit@example.com",
		Name:         "healthitemsinit",
		Password:     "a",
	}
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	assert.Equal(t, HealthItemsInit(ctx, aa.ID), nil)

	items := HealthItems{}

	ReadAll(ctx, &items, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(items), 38)

	aa.Delete(ctx)
}
