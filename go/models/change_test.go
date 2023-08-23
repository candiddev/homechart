package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestChangeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testchange@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	ctx = SetAuthAccountID(ctx, aa.ID)

	l := Changes{}

	ReadAll(ctx, &l, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(l), 0)

	for i := 1; i <= 55; i++ {
		task := PlanTask{}
		task.AuthHouseholdID = &ah.ID
		task.Name = "bad"

		if i == 55 {
			task.Name = "good"
		}

		ChangeCreate(ctx, types.TableNotifyOperationCreate, &task)
	}

	ReadAll(ctx, &l, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(l), 50)
	assert.Equal(t, l[0].AuthAccountID, aa.ID)
	assert.Equal(t, l[49].Name, "good")

	l[0].TableName = tableNames[modelBudgetAccount]
	l[1].TableName = tableNames[modelCalendarEvent]
	l[2].TableName = tableNames[modelCookMealPlan]
	l[3].TableName = tableNames[modelHealthItem]
	l[4].TableName = tableNames[modelInventoryItem]
	l[5].TableName = tableNames[modelNotesPage]
	l[6].TableName = tableNames[modelPlanProject]
	l[7].TableName = tableNames[modelShopCategory]

	assert.Equal(t, len(l.Filter(AuthHouseholdsPermissions{
		{
			AuthHouseholdID: ah.ID,
			Permissions: Permissions{
				Auth:      PermissionView,
				Budget:    PermissionNone,
				Calendar:  PermissionNone,
				Cook:      PermissionNone,
				Inventory: PermissionNone,
				Notes:     PermissionNone,
				Plan:      PermissionView,
				Shop:      PermissionNone,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
		},
	})), len(l)-6)

	aa.Delete(ctx)
	ah.Delete(ctx)
}
