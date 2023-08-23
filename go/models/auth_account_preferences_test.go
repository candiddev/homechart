package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestAuthAccountPreferencesNotificationsHouseholdSanitize(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthAccountPreferencesNotificationsHouseholds{
		{},
		{
			AuthHouseholdID: GenerateUUID(),
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
		},
		{
			AuthHouseholdID:           seed.AuthHouseholds[1].ID,
			IgnoreDeviceCalendarEvent: true,
		},
	}

	a.Sanitize(ctx, seed.AuthAccounts[0].ID)
	assert.Equal(t, a, AuthAccountPreferencesNotificationsHouseholds{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
		},
		{
			AuthHouseholdID:           seed.AuthHouseholds[1].ID,
			IgnoreDeviceCalendarEvent: true,
		},
	})
}
