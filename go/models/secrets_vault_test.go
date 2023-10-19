package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestSecretsVaultCreate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsVaults[0]
	s.ID = uuid.Nil

	assert.Equal(t, s.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, s.ID != seed.SecretsVaults[0].ID, true)

	Delete(ctx, &s, DeleteOpts{})

	// Test existing ShortID
	id := types.NewNanoid()

	s.Name = "create"
	s.ShortID = id

	assert.Equal(t, s.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, s.ShortID, id)

	Delete(ctx, &s, DeleteOpts{})

	// Invalid
	s.Keys[0].Key.Encryption = cryptolib.EncryptionNone
	assert.Equal[error](t, s.create(ctx, CreateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: s.AuthAccountID,
		},
	}), errs.ErrSenderBadRequest)

	s.Keys = nil

	assert.Equal[error](t, s.create(ctx, CreateOpts{}), errs.ErrSenderBadRequest)

	s.Keys = seed.SecretsVaults[0].Keys

	assert.Equal[error](t, s.create(ctx, CreateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[1].ID,
		},
	}), errs.ErrSenderBadRequest)
}

func TestSecretsVaultUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsVaults[0]
	s.create(ctx, CreateOpts{})

	s.Icon = "test"
	s.Keys = SecretsVaultKeys{
		{
			Key:           seed.SecretsVaults[1].Keys[0].Key,
			AuthAccountID: seed.AuthAccounts[0].ID,
		},
	}
	s.Name = "test"

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

	vault := SecretsVault{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		ID:            s.ID,
	}

	Read(ctx, &vault, ReadOpts{})

	assert.Equal(t, vault, s)

	Delete(ctx, &s, DeleteOpts{})
}
