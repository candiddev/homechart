package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// SecretsVault defines vault fields.
type SecretsVault struct {
	AuthAccountID   *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	Icon            types.StringLimit `db:"icon" json:"icon"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Keys            SecretsVaultKeys  `db:"keys" json:"keys"`
	Name            types.StringLimit `db:"name" json:"name"`
	ShortID         types.Nanoid      `db:"short_id" json:"shortID"`
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
} // @Name SecretsVault

func (s *SecretsVault) SetID(id uuid.UUID) {
	s.ID = id
}

func (s *SecretsVault) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := s.validate(opts.PermissionsOpts); err != nil {
		return logger.Error(ctx, err)
	}

	s.ID = GenerateUUID()

	if !opts.Restore || s.ShortID == "" {
		s.ShortID = types.NewNanoid()
	}

	return logger.Error(ctx, db.Query(ctx, false, s, `
INSERT INTO secrets_vault (
	  auth_account_id
	, auth_household_id
	, icon
	, id
	, keys
	, name
	, short_id
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :icon
	, :id
	, :keys
	, :name
	, :short_id
)
RETURNING *
`, s))
}

func (s *SecretsVault) getChange(_ context.Context) string {
	if s.AuthHouseholdID != nil {
		return string(s.Name)
	}

	return ""
}

func (s *SecretsVault) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return s.AuthAccountID, s.AuthHouseholdID, &s.ID
}

func (*SecretsVault) getType() modelType {
	return modelSecretsVault
}

func (s *SecretsVault) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case s.AuthAccountID != nil && authAccountID != nil:
		s.AuthAccountID = authAccountID
	case s.AuthHouseholdID != nil && authHouseholdID != nil:
		s.AuthHouseholdID = authHouseholdID
	default:
		s.AuthAccountID = authAccountID
		s.AuthHouseholdID = authHouseholdID
	}
}

func (s *SecretsVault) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := s.validate(opts.PermissionsOpts); err != nil {
		return logger.Error(ctx, err)
	}

	query := fmt.Sprintf(`
UPDATE secrets_vault
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, icon = :icon
	, keys = :keys
	, name = :name
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, s, query, s))
}

func (s *SecretsVault) validate(p PermissionsOpts) errs.Err {
	if len(s.Keys) == 0 {
		return errs.ErrSenderBadRequest
	}

	if p.AuthAccountID != nil {
		match := false

		for k := range s.Keys {
			if s.Keys[k].AuthAccountID == *p.AuthAccountID && s.Keys[k].Key.Encryption == crypto.TypeRSA2048 {
				match = true

				break
			}
		}

		if !match {
			return errs.ErrSenderBadRequest
		}
	}

	return nil
}

// SecretsVaults is multiple SecretsVault.
type SecretsVaults []SecretsVault

func (*SecretsVaults) getType() modelType {
	return modelSecretsVault
}
