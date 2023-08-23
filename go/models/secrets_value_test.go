package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestSecretsValueCreate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsValues[0]

	assert.Equal(t, s.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, s.ID != seed.SecretsValues[0].ID, true)

	Delete(ctx, &s, DeleteOpts{})

	// Test existing ShortID
	id := types.NewNanoid()
	s.ShortID = id

	assert.Equal(t, s.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, s.ShortID, id)

	Delete(ctx, &s, DeleteOpts{})
}

func TestSecretsValuesDelete(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsValues[0]
	n := time.Now().Add(-24*time.Hour*time.Duration(c.App.KeepDeletedDays) + -1)
	s.Deleted = &n
	s.create(ctx, CreateOpts{})

	p := PermissionsOpts{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
			},
		},
	}

	var sv SecretsValues

	ReadAll(ctx, &sv, ReadAllOpts{
		PermissionsOpts: p,
	})

	assert.Equal(t, len(sv), 5)

	SecretsValuesDelete(ctx)

	ReadAll(ctx, &sv, ReadAllOpts{
		PermissionsOpts: p,
	})

	assert.Equal(t, len(sv), 4)
}

func TestSecretsValueUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsValues[0]
	s.create(ctx, CreateOpts{})

	s.Deleted = &s.Updated
	s.NameEncrypted, _ = crypto.EncryptValue(nil, "test")
	s.NameEncrypted.Encryption = crypto.TypeAES128GCM

	s.DataEncrypted = crypto.EncryptedValues{
		s.NameEncrypted,
	}
	s.TagsEncrypted = s.NameEncrypted

	assert.Equal(t, s.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	value := SecretsValue{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		ID:            s.ID,
	}

	Read(ctx, &value, ReadOpts{})

	assert.Equal(t, value, s)

	Delete(ctx, &s, DeleteOpts{})
}
