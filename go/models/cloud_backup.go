package models

import (
	"context"
	"errors"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// CloudBackup defines cloud backup fields.
type CloudBackup struct {
	AuthHouseholdID uuid.UUID `db:"auth_household_id" json:"authHouseholdID"`
	Created         time.Time `db:"created" json:"created"`
	Data            []byte    `db:"data" json:"-"`
	ID              uuid.UUID `db:"id" json:"id"`
}

// CloudBackups is multiple CloudBackup.
type CloudBackups []CloudBackup

// CloudBackupRead returns a backup from the database.
func CloudBackupRead(ctx context.Context, authHouseholdID, id uuid.UUID) []byte {
	ctx = logger.Trace(ctx)

	output := []byte{}

	err := db.Query(ctx, false, &output, `
SELECT data
FROM cloud_backup
WHERE
	auth_household_id = $1
	AND id = $2
`, nil, authHouseholdID, id)
	logger.Error(ctx, err) //nolint:errcheck

	return output
}

// CloudBackupsRead gets a list of backups from the database.
func CloudBackupsRead(ctx context.Context, authHouseholdID uuid.UUID) (CloudBackups, errs.Err) {
	ctx = logger.Trace(ctx)

	backups := CloudBackups{}

	return backups, logger.Error(ctx, db.Query(ctx, true, &backups, `
SELECT
	  created
	, id
FROM cloud_backup
WHERE auth_household_id = $1
`, nil, authHouseholdID))
}

// Create adds a new backup to the database.
func (b *CloudBackup) Create(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	err := db.Query(ctx, false, b, `
INSERT INTO cloud_backup (
	  auth_household_id
	, data
	, id
) VALUES (
	  :auth_household_id
	, :data
	, :id
)
RETURNING *
`, b)
	if err != nil {
		return logger.Error(ctx, err)
	}

	delErr := db.Exec(ctx, `
DELETE FROM cloud_backup
WHERE
	id NOT IN (
		SELECT id
		FROM cloud_backup
		ORDER BY created DESC
		LIMIT 5
	);
`, nil)
	if delErr != nil && !errors.Is(delErr, errs.ErrSenderNoContent) {
		return logger.Error(ctx, delErr)
	}

	return logger.Error(ctx, err)
}

// Delete removes a CloudBackup from the database.
func (b *CloudBackup) Delete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Exec(ctx, `
DELETE FROM cloud_backup
WHERE id = :id
AND auth_household_id = :auth_household_id
`, b))
}
