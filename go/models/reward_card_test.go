package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestRewardCardCreate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Read(ctx)

	r := seed.RewardCards[0]
	r.Details = "something"
	r.Invert = true
	r.Name = "test"
	r.Recipients = types.SliceString{
		"a",
		"b",
	}
	r.Reward = "big reward"
	r.Senders = types.SliceString{
		"a",
		"b",
	}
	r.StampCount = 10
	r.StampGoal = 10

	assert.Equal(t, r.create(ctx, CreateOpts{}), nil)

	rr := RewardCard{
		AuthHouseholdID: r.AuthHouseholdID,
		ID:              r.ID,
	}

	Read(ctx, &rr, ReadOpts{})

	assert.Equal(t, r, rr)

	Delete(ctx, &r, DeleteOpts{})

	// Existing short ID
	id := types.NewNanoid()
	r = seed.RewardCards[0]
	r.Name = "testing"
	r.ShortID = id

	assert.Equal(t, r.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, r.ShortID, id)

	Delete(ctx, &r, DeleteOpts{})
}

func TestRewardCardUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	r := seed.RewardCards[0]
	r.Name = "test"

	r.Details = "something"
	r.Invert = true
	r.Name = "new name"
	r.Recipients = types.SliceString{
		"a",
		"b",
	}
	r.Reward = "big reward"
	r.Senders = types.SliceString{
		"c",
		"d",
	}
	r.StampCount = 20
	r.StampGoal = 20

	assert.Equal(t, r.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	rr := RewardCard{
		AuthHouseholdID: r.AuthHouseholdID,
		ID:              r.ID,
	}

	Read(ctx, &rr, ReadOpts{})

	assert.Equal(t, rr, r)

	Delete(ctx, &r, DeleteOpts{})
}
