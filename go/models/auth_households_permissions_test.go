package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestAuthHouseholdsPermissionsSanitize(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthHouseholdsPermissions{
		{
			AuthHouseholdID: GenerateUUID(),
			Permissions:     Permissions{},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Permissions:     Permissions{},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[1].ID,
			Permissions: Permissions{
				Calendar: PermissionView,
			},
		},
	}

	a.Sanitize(ctx, seed.AuthAccounts[0].ID)

	assert.Equal(t, a, AuthHouseholdsPermissions{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Permissions:     Permissions{},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[1].ID,
			Permissions: Permissions{
				Calendar: PermissionView,
			},
		},
	})
}
