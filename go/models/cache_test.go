package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestCacheDeleteExpired(t *testing.T) {
	logger.UseTestLogger(t)

	expires := c.App.CacheTTLMinutes
	c.App.CacheTTLMinutes = 5

	c1 := Cache{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		TableName:     "test1",
		Value:         &seed.BudgetAccounts[0],
	}
	c1.Set(ctx)

	c.App.CacheTTLMinutes = 0
	c2 := Cache{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		TableName:     "test2",
		Value:         &seed.BudgetAccounts[0],
	}
	c2.Set(ctx)

	CacheDeleteExpired(ctx)

	c1.Value = &BudgetAccount{}
	c1.Get(ctx)

	assert.Equal(t, &seed.BudgetAccounts[0], c1.Value.(*BudgetAccount))

	c2.Value = &BudgetAccount{}
	c2.Get(ctx)

	assert.Equal(t, &BudgetAccount{}, c2.Value.(*BudgetAccount))

	c.App.CacheTTLMinutes = expires
}

func TestCacheGet(t *testing.T) {
	logger.UseTestLogger(t)

	cache := Cache{
		ID:        &seed.AuthHouseholds[0].ID,
		TableName: "auth_household",
		Value:     &seed.AuthHouseholds[0],
	}
	cache.Set(ctx)

	a := AuthHousehold{}
	cache.Value = &a

	assert.Equal(t, cache.Get(ctx), nil)

	a.FeatureVotes = AuthHouseholdFeatureVotes{}

	assert.Equal(t, a, seed.AuthHouseholds[0])
}

func TestCacheSet(t *testing.T) {
	logger.UseTestLogger(t)

	cache := Cache{
		ID:        &seed.AuthHouseholds[0].ID,
		TableName: "auth_household",
		Value:     &seed.AuthHouseholds[0],
	}

	assert.Equal(t, cache.Set(ctx), nil)

	assert.Equal(t, cache.Expires.After(time.Now().Add(time.Duration(c.App.CacheTTLMinutes-1)*time.Minute)), true)

	expires := cache.Expires

	assert.Equal(t, cache.Set(ctx), nil)
	assert.Equal(t, cache.Expires.Equal(expires), false)

	cache = Cache{
		ID:        &seed.AuthHouseholds[0].ID,
		TableName: "auth_household",
		Value:     &seed.AuthHouseholds[0],
	}

	assert.Equal(t, cache.Set(ctx), nil)
}
