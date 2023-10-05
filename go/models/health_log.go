package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// HealthLog defines log fields.
type HealthLog struct {
	AuthAccountID uuid.UUID       `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	HealthItemID  uuid.UUID       `db:"health_item_id" format:"uuid" json:"healthItemID"`
	ID            uuid.UUID       `db:"id" format:"uuid" json:"id"`
	Date          types.CivilDate `db:"date" json:"date"`
	Created       time.Time       `db:"created" json:"created"`
	Updated       time.Time       `db:"updated" json:"updated"`
} // @Name HealthLog

func (h *HealthLog) SetID(id uuid.UUID) {
	h.ID = id
}

func (h *HealthLog) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	h.ID = GenerateUUID()

	return logger.Error(ctx, db.Query(ctx, false, h, `
INSERT INTO health_log (
	  auth_account_id
	, date
	, health_item_id
	, id
) VALUES (
	  :auth_account_id
	, :date
	, :health_item_id
	, :id
)
RETURNING *
`, h))
}

func (h *HealthLog) getChange(ctx context.Context) string {
	aa := AuthAccount{
		ID: h.AuthAccountID,
	}

	if err := aa.Read(ctx); err != nil || !aa.Child {
		return ""
	}

	hi := HealthItem{
		AuthAccountID: h.AuthAccountID,
		ID:            h.HealthItemID,
	}

	if err := Read(ctx, &hi, ReadOpts{}); err != nil {
		return ""
	}

	return string(hi.Name)
}

func (h *HealthLog) getIDs() (authAccountID, _, id *uuid.UUID) {
	return &h.AuthAccountID, nil, &h.ID
}

func (*HealthLog) getType() modelType {
	return modelHealthLog
}

func (*HealthLog) setIDs(_, _ *uuid.UUID) {} // Can't set IDs for HealthLogs as they may be for a child.

func (h *HealthLog) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE health_log
SET
	  date = :date
	, health_item_id = :health_item_id
FROM auth_account
WHERE health_log.id = :id
AND health_log.auth_account_id = auth_account.id
AND (
	health_log.auth_account_id = '%s'
	OR (
		auth_account.primary_auth_household_id = ANY('%s')
		AND auth_account.child
	)
)
RETURNING health_log.*
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs().String())

	return logger.Error(ctx, db.Query(ctx, false, h, query, h))
}

// HealthLogs is multiple HealthLog.
type HealthLogs []HealthLog

func (*HealthLogs) getType() modelType {
	return modelHealthLog
}

// HealthLogsDelete deletes old HealthLogs from a database.
func HealthLogsDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf("DELETE FROM health_log WHERE date < CURRENT_DATE - INTERVAL '%d day'", c.App.KeepHealthLogDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}
