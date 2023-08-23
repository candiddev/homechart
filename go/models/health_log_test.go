package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestHealthLogCreate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "healthlog@example.com"
	aa.Create(ctx, false)

	hi1 := seed.HealthItems[0]
	hi1.AuthAccountID = aa.ID
	hi1.Name = "test1"
	hi1.create(ctx, CreateOpts{})

	hi2 := seed.HealthItems[2]
	hi2.AuthAccountID = aa.ID
	hi2.Name = "test2"
	hi2.create(ctx, CreateOpts{})

	hi3 := seed.HealthItems[2]
	hi3.AuthAccountID = aa.ID
	hi3.Name = "test3"
	hi3.create(ctx, CreateOpts{})

	hl1 := seed.HealthLogs[0]
	hl1.AuthAccountID = aa.ID
	hl1.Date = types.CivilDateToday()
	hl1.HealthItemID = hi1.ID

	assert.Equal(t, hl1.create(ctx, CreateOpts{}), nil)

	hll := HealthLog{
		AuthAccountID: hl1.AuthAccountID,
		ID:            hl1.ID,
	}

	Read(ctx, &hll, ReadOpts{})

	assert.Equal(t, hll, hl1)

	// Test create/delete triggers
	hl2 := hl1
	hl2.create(ctx, CreateOpts{})

	hl3 := hl1
	hl3.HealthItemID = hi2.ID
	hl3.create(ctx, CreateOpts{})

	hl4 := hl1
	hl4.HealthItemID = hi3.ID
	hl4.create(ctx, CreateOpts{})

	Read(ctx, &hi1, ReadOpts{})

	assert.Equal(t, hi1.Correlations[hi2.ID], 1)
	assert.Equal(t, hi1.Correlations[hi3.ID], 1)
	assert.Equal(t, hi1.TotalCorrelations, 2)

	Read(ctx, &hi2, ReadOpts{})

	assert.Equal(t, hi2.Correlations[hi1.ID], 2)
	assert.Equal(t, hi2.TotalCorrelations, 2)

	Delete(ctx, &hl3, DeleteOpts{})
	Delete(ctx, &hl4, DeleteOpts{})

	hi1.Correlations = HealthItemCorrelations{}
	Read(ctx, &hi1, ReadOpts{})

	assert.Equal(t, hi1.Correlations[hi2.ID], 0)
	assert.Equal(t, hi1.Correlations[hi3.ID], 0)
	assert.Equal(t, hi1.TotalCorrelations, 0)

	Read(ctx, &hi2, ReadOpts{})

	assert.Equal(t, hi2.Correlations[hi1.ID], 0)
	assert.Equal(t, hi2.TotalCorrelations, 0)

	aa.Delete(ctx)
}

func TestHealthLogUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testhealthlog@example.com"
	aa.Child = true
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	hi1 := seed.HealthItems[0]
	hi1.AuthAccountID = aa.ID
	hi1.Name = "test1"
	hi1.create(ctx, CreateOpts{})

	hi2 := seed.HealthItems[2]
	hi2.AuthAccountID = aa.ID
	hi2.Name = "test2"
	hi2.create(ctx, CreateOpts{})

	hi3 := seed.HealthItems[2]
	hi3.AuthAccountID = aa.ID
	hi3.Name = "test3"
	hi3.create(ctx, CreateOpts{})

	hl0 := seed.HealthLogs[0]
	hl0.create(ctx, CreateOpts{})
	hl0.Date = types.CivilDateToday().AddDays(1)
	hl0.HealthItemID = seed.HealthItems[1].ID

	hl1 := seed.HealthLogs[0]
	hl1.AuthAccountID = aa.ID
	hl1.HealthItemID = hi1.ID
	hl1.create(ctx, CreateOpts{})

	hl2 := seed.HealthLogs[0]
	hl2.AuthAccountID = aa.ID
	hl2.HealthItemID = hi2.ID
	hl2.create(ctx, CreateOpts{})

	hl3 := seed.HealthLogs[0]
	hl3.AuthAccountID = aa.ID
	hl3.HealthItemID = hi3.ID
	hl3.create(ctx, CreateOpts{})
	hl3.HealthItemID = hi1.ID

	tests := map[string]struct {
		authHouseholdID uuid.UUID
		err             error
		healthLog       *HealthLog
	}{
		"personal": {
			authHouseholdID: uuid.UUID{},
			healthLog:       &hl0,
		},
		"personal not admin": {
			err:             errs.ErrClientNoContent,
			authHouseholdID: uuid.UUID{},
			healthLog:       &hl3,
		},
		"household": {
			authHouseholdID: seed.AuthHouseholds[0].ID,
			healthLog:       &hl3,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.healthLog.update(ctx, UpdateOpts{
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
				h := HealthLog{
					AuthAccountID: seed.AuthAccounts[0].ID,
					ID:            tc.healthLog.ID,
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

				assert.Equal(t, h, *tc.healthLog)
			}

			if name == "household" {
				Read(ctx, &hi3, ReadOpts{})

				assert.Equal(t, hi3.TotalCorrelations, 1)

				Read(ctx, &hi2, ReadOpts{})

				assert.Equal(t, hi2.TotalCorrelations, 2)
			}
		})
	}

	aa.Delete(ctx)
}

func TestHealthLogsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthLogs[0]
	i.Date = i.Date.AddDays(-365)
	i.create(ctx, CreateOpts{})

	logs := HealthLogs{}

	ReadAll(ctx, &logs, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	notWant := len(logs)

	HealthLogsDelete(ctx)

	logs = HealthLogs{}

	ReadAll(ctx, &logs, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	assert.Equal(t, len(logs) != notWant, true)
}
