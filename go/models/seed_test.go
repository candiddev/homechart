package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestSeed(t *testing.T) {
	logger.UseTestLogger(t)

	var err error

	seed, err = Seed(ctx, false)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(seed.AuthAccounts), 5)

	seed2, err := Seed(ctx, true)

	assert.Equal(t, err, nil)
	assert.Equal(t, seed2.AuthAccounts[0].EmailAddress != seed.AuthAccounts[0].EmailAddress, true)

	assert.Equal(t, seed2.AuthHouseholds[0].SubscriptionExpires, types.CivilDateToday())

	for i := range seed2.AuthAccounts {
		seed2.AuthAccounts[i].Delete(ctx)
	}

	AuthHouseholdsDeleteEmptyAndExpired(ctx)

	_, got, _ := AuthAccountsRead(ctx, "", uuid.UUID{}, 0)
	assert.Equal(t, got, 5)
}
