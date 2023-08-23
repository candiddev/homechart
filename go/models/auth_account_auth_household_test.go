package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestAuthAccountAuthHouseholdInviteAcceptCreate(t *testing.T) {
	logger.UseTestLogger(t)

	p := Permissions{
		Calendar: PermissionNone,
	}

	a := AuthAccountAuthHousehold{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Color:           types.ColorBlue,
		EmailAddress:    "test@example.com",
		Permissions:     p,
	}

	assert.Equal(t, a.InviteCreate(ctx), nil)
	assert.Equal(t, a.InviteToken != "", true)
	assert.Equal(t, a.Permissions, p)
	assert.Equal(t, a.Color, types.ColorBlue)

	a.AuthAccountID = &seed.AuthAccounts[4].ID
	assert.Equal(t, a.InviteAccept(ctx), nil)
	assert.Equal(t, a.InviteToken == "", true)
	assert.Equal(t, a.AuthAccountID, &seed.AuthAccounts[4].ID)

	a.EmailAddress = seed.AuthAccounts[4].EmailAddress.String()
	id := a.ID
	assert.HasErr(t, a.InviteCreate(ctx), errs.ErrClientConflictExists)
	assert.Equal(t, a.ID, id)

	Delete(ctx, &a, DeleteOpts{})
}

func TestAuthAccountAuthHouseholdInviteDelete(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthAccountAuthHousehold{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Color:           types.ColorBlue,
		EmailAddress:    "test@example.com",
	}

	a.InviteCreate(ctx)

	aa := AuthAccountAuthHousehold{
		InviteToken: a.InviteToken,
	}

	assert.Equal(t, aa.InviteDelete(ctx), nil)
	assert.HasErr(t, Read(ctx, &a, ReadOpts{}), errs.ErrClientBadRequestMissing)
}
func TestAuthAccountAuthHouseholdUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthAccountAuthHousehold{
		AuthAccountID:   &seed.AuthAccounts[4].ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Color:           types.ColorBlue,
		EmailAddress:    "test@example.com",
		Permissions: Permissions{
			Calendar: PermissionNone,
		},
	}
	a.create(ctx, CreateOpts{})
	a.Color = types.ColorRed
	a.Permissions = Permissions{}

	an := a
	an.update(ctx, UpdateOpts{})

	a.Updated = an.Updated

	assert.Equal(t, an, a)

	Delete(ctx, &a, DeleteOpts{})
}
