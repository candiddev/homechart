package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// SecretsValue is a value in a SecretsVault.
type SecretsValue struct {
	AuthAccountID   *uuid.UUID                `db:"auth_account_id" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID                `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID                 `db:"id" format:"uuid" json:"id"`
	DataEncrypted   cryptolib.EncryptedValues `db:"data_encrypted" json:"dataEncrypted"`
	NameEncrypted   cryptolib.EncryptedValue  `db:"name_encrypted" json:"nameEncrypted"`
	TagsEncrypted   cryptolib.EncryptedValue  `db:"tags_encrypted" json:"tagsEncrypted"`
	SecretsVaultID  uuid.UUID                 `db:"secrets_vault_id" format:"uuid" json:"secretsVaultID"`
	ShortID         types.Nanoid              `db:"short_id" json:"shortID"`
	Deleted         *time.Time                `db:"deleted" format:"date-time" json:"deleted"`
	Updated         time.Time                 `db:"updated" format:"date-time" json:"updated"`
} // @Name SecretsValue

func (s *SecretsValue) SetID(id uuid.UUID) {
	s.ID = id
}

func (s *SecretsValue) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := s.validate(); err != nil {
		return logger.Error(ctx, err)
	}

	s.ID = GenerateUUID()

	if s.Updated.IsZero() {
		s.Updated = GenerateTimestamp()
	}

	if !opts.Restore || s.ShortID == "" {
		s.ShortID = types.NewNanoid()
	}

	err := db.Query(ctx, false, s, `
INSERT INTO secrets_value (
	  data_encrypted
	, deleted
	, id
	, name_encrypted
	, secrets_vault_id
	, short_id
	, tags_encrypted
	, updated
) VALUES (
	  :data_encrypted
	, :deleted
	, :id
	, :name_encrypted
	, :secrets_vault_id
	, :short_id
	, :tags_encrypted
	, :updated
)
RETURNING *
`, s)

	return logger.Error(ctx, err)
}

func (s *SecretsValue) getChange(_ context.Context) string {
	return "#secretvalue/" + string(s.ShortID)
}

func (s *SecretsValue) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return s.AuthAccountID, s.AuthHouseholdID, &s.ID
}

func (*SecretsValue) getType() modelType {
	return modelSecretsValue
}

func (s *SecretsValue) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
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

func (s *SecretsValue) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := s.validate(); err != nil {
		return logger.Error(ctx, err)
	}

	query := fmt.Sprintf(`
UPDATE secrets_value
SET
	  data_encrypted = :data_encrypted
	, deleted = :deleted
	, name_encrypted = :name_encrypted
	, secrets_vault_id = :secrets_vault_id
	, tags_encrypted = :tags_encrypted
FROM secrets_vault
WHERE secrets_value.id = :id
AND secrets_vault.id = secrets_value.secrets_vault_id
AND (
	secrets_vault.auth_account_id = '%s'
	OR secrets_vault.auth_household_id = ANY('%s')
)
RETURNING secrets_value.*
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, s, query, s))
}

func (s *SecretsValue) validate() errs.Err {
	for i := range s.DataEncrypted {
		if s.DataEncrypted[i].Encryption != cryptolib.EncryptionAES128GCM {
			return errs.ErrSenderBadRequest.Set("data encryption type must be aes128gcm")
		}
	}

	if s.NameEncrypted.Encryption != cryptolib.EncryptionAES128GCM || s.TagsEncrypted.Encryption != cryptolib.EncryptionAES128GCM {
		return errs.ErrSenderBadRequest.Set("name and tag encryption type must be aes128gcm")
	}

	return nil
}

// SecretsValues is multiple SecretValue.
type SecretsValues []SecretsValue

func (*SecretsValues) getType() modelType {
	return modelSecretsValue
}

// SecretsValuesDelete deletes all values marked for deletion.
func SecretsValuesDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf("DELETE FROM secrets_value WHERE deleted > '0001-01-01' AND deleted < now() - interval '%d day'", c.App.KeepDeletedDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}
