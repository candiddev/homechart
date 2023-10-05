package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

const budgetTransactionCategoryInsert = `
INSERT INTO budget_transaction_category (
	  amount
	, auth_household_id
	, budget_category_id
	, budget_transaction_id
	, id
	, year_month
) VALUES (
	  :amount
	, :auth_household_id
	, :budget_category_id
	, :budget_transaction_id
	, :id
	, :year_month
)
`

// BudgetTransactionCategory maps accounts to a transaction.
type BudgetTransactionCategory struct {
	BudgetCategoryID    *uuid.UUID      `db:"budget_category_id" format:"uuid" json:"budgetCategoryID"`
	BudgetTransactionID *uuid.UUID      `db:"budget_transaction_id" format:"uuid" json:"budgetTransactionID"`
	AuthHouseholdID     uuid.UUID       `db:"auth_household_id" json:"authHouseholdID"`
	ID                  uuid.UUID       `db:"id" format:"uuid" json:"id"`
	Amount              int             `db:"amount" json:"amount"`
	YearMonth           types.YearMonth `db:"year_month" json:"yearMonth" swaggertype:"integer"`
} // @Name BudgetTransactionCategory

func (b *BudgetTransactionCategory) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetTransactionCategory) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	return logger.Error(ctx, db.Query(ctx, false, b, budgetTransactionCategoryInsert+`
RETURNING *
`, b))
}

func (*BudgetTransactionCategory) getChange(_ context.Context) string {
	return ""
}

func (b *BudgetTransactionCategory) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetTransactionCategory) getType() modelType {
	return modelBudgetTransactionCategory
}

func (b *BudgetTransactionCategory) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetTransactionCategory) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, b, `
UPDATE budget_transaction_category
SET
	  amount = :amount
	, budget_category_id = :budget_category_id
	, year_month = :year_month
WHERE auth_household_id = :auth_household_id
AND id = :id
RETURNING *
`, b))
}

// BudgetTransactionCategories is multiple BudgetTransactionCategory.
type BudgetTransactionCategories []BudgetTransactionCategory

func (*BudgetTransactionCategories) getType() modelType {
	return modelBudgetTransactionCategory
}

// Scan reads in a BudgetTransactionCategories from a database.
func (b *BudgetTransactionCategories) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[{`) {
			err := json.Unmarshal(src.([]byte), b)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// Value converts a BudgetTransactionCategory to JSON.
func (b BudgetTransactionCategories) Value() (driver.Value, error) {
	if len(b) == 0 {
		return []byte("[]"), nil
	}

	j, err := json.Marshal(b)

	return j, err
}
