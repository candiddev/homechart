package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetRecurrence defines account fields.
type BudgetRecurrence struct {
	BudgetAccountID uuid.UUID                `db:"budget_account_id" format:"uuid" json:"budgetAccountID"`
	Created         time.Time                `db:"created" format:"date-time" json:"created"`
	Updated         time.Time                `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID uuid.UUID                `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID                `db:"id" format:"uuid" json:"id"`
	Template        BudgetRecurrenceTemplate `db:"template" json:"template"`
	Recurrence      types.Recurrence         `db:"recurrence" json:"recurrence"`
} // @Name BudgetRecurrence

// BudgetRecurrenceTemplate is a BudgetTransaction template.
type BudgetRecurrenceTemplate struct {
	BudgetTransaction
} // @Name BudgetRecurrenceTemplate

func (b *BudgetRecurrence) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetRecurrence) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	return logger.Error(ctx, db.Query(ctx, false, b, `
INSERT INTO budget_recurrence (
	  auth_household_id
	, budget_account_id
	, id
	, recurrence
	, template
) VALUES (
	  :auth_household_id
	, :budget_account_id
	, :id
	, :recurrence
	, :template
)
RETURNING *
`, b))
}

func (*BudgetRecurrence) getChange(_ context.Context) string {
	return ""
}

func (b *BudgetRecurrence) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetRecurrence) getType() modelType {
	return modelBudgetRecurrence
}

func (b *BudgetRecurrence) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetRecurrence) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, b, `
UPDATE budget_recurrence
SET
	  budget_account_id = :budget_account_id
	, recurrence = :recurrence
	, template = :template
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, b))
}

// Scan reads in a BudgetRecurrenceTemplate from a database.
func (b *BudgetRecurrenceTemplate) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), b)

			return err
		}
	}

	return nil
}

// Value converts a BudgetRecurrenceTemplate to JSON.
func (b BudgetRecurrenceTemplate) Value() (driver.Value, error) {
	j, err := json.Marshal(b)

	return j, err
}

// BudgetRecurrences is multiple BudgetRecurrence.
type BudgetRecurrences []BudgetRecurrence

func (*BudgetRecurrences) getType() modelType {
	return modelBudgetRecurrence
}
