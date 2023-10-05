package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthAccountAuthHousehold is a mapping of an AuthAccount to an AuthHousehold.
type AuthAccountAuthHousehold struct {
	AuthAccountID   *uuid.UUID        `db:"auth_account_id" json:"authAccountID"`
	EmailAddress    string            `db:"email_address" json:"emailAddress"`
	InviteToken     types.StringLimit `db:"invite_token" json:"inviteToken"`
	AuthHouseholdID uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID         `db:"id" json:"id"`
	Created         time.Time         `db:"created" json:"created"`
	Updated         time.Time         `db:"updated" json:"updated"`
	Color           types.Color       `db:"color" json:"color"`
	Permissions     Permissions       `db:"permissions" json:"permissions"`
	Child           bool              `db:"-" json:"child,omitempty"`
	Name            types.StringLimit `db:"-" json:"name,omitempty"`
}

// AuthAccountAuthHouseholds is multiple AuthAccountAuthHousehold.
type AuthAccountAuthHouseholds []AuthAccountAuthHousehold

// InviteAccept maps an AuthAccountAuthHousehold invite token to an AuthAccountID.
func (a *AuthAccountAuthHousehold) InviteAccept(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Query(ctx, false, a, `
UPDATE auth_account_auth_household
SET
	  auth_account_id = :auth_account_id
	, email_address = ''
	, invite_token = ''
WHERE invite_token = UPPER(:invite_token) AND invite_token != ''
RETURNING *
`, a))
}

// InviteCreate creates a temporary AuthAccountAuthHousehold.
func (a *AuthAccountAuthHousehold) InviteCreate(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	aa := AuthAccount{
		EmailAddress: types.EmailAddress(a.EmailAddress),
	}
	if err := aa.ReadPasswordHash(ctx); err == nil {
		aaah := AuthAccountAuthHousehold{
			AuthAccountID:   &aa.ID,
			AuthHouseholdID: a.AuthHouseholdID,
		}
		if err := aaah.readAuthIDs(ctx); err == nil {
			return logger.Error(ctx, errs.ErrSenderConflict)
		}

		a.AuthAccountID = &aa.ID
	}

	a.InviteToken = types.StringLimit(types.NewNanoid())

	return logger.Error(ctx, a.create(ctx, CreateOpts{}))
}

// InviteDelete removes an AuthAccountAuthHousehold using an invite token.
func (a *AuthAccountAuthHousehold) InviteDelete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Exec(ctx, `
DELETE FROM auth_account_auth_household
WHERE invite_token = UPPER(:invite_token)
`, a))
}

func (a *AuthAccountAuthHousehold) SetID(id uuid.UUID) {
	a.ID = id
}

// Create adds an AuthAccountAuthHousehold to a database.
func (a *AuthAccountAuthHousehold) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	a.ID = GenerateUUID()

	return logger.Error(ctx, db.Query(ctx, false, a, `
INSERT INTO auth_account_auth_household (
	  auth_account_id
	, auth_household_id
	, email_address
	, color
	, id
	, invite_token
	, permissions
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :email_address
	, :color
	, :id
	, UPPER(:invite_token)
	, :permissions
)
RETURNING *
`, a))
}

func (*AuthAccountAuthHousehold) getChange(_ context.Context) string {
	return ""
}

func (a *AuthAccountAuthHousehold) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return a.AuthAccountID, &a.AuthHouseholdID, &a.ID
}

func (*AuthAccountAuthHousehold) getType() modelType {
	return modelAuthAccountAuthHousehold
}

func (a *AuthAccountAuthHousehold) readAuthIDs(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Query(ctx, false, a, `
SELECT * FROM auth_account_auth_household
WHERE
	auth_account_id = :auth_account_id
	AND auth_household_id = :auth_household_id
`, a))
}

func (a *AuthAccountAuthHousehold) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		a.AuthHouseholdID = *authHouseholdID
	}
}

// Update updates an AuthAccountAuthHousehold.
func (a *AuthAccountAuthHousehold) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Query(ctx, false, a, `
UPDATE auth_account_auth_household
SET
	  color = :color
	, permissions = :permissions
WHERE
	auth_account_id = :auth_account_id
	AND auth_household_id = :auth_household_id
RETURNING *
`, a))
}

func (*AuthAccountAuthHouseholds) getType() modelType {
	return modelAuthAccountAuthHousehold
}
