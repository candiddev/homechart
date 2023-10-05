package models

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetMonthCategory defines month category fields.
type BudgetMonthCategory struct {
	AuthHouseholdID         uuid.UUID       `db:"auth_household_id" json:"authHouseholdID"`
	BudgetCategoryID        uuid.UUID       `db:"budget_category_id" format:"uuid" json:"budgetCategoryID"`
	Amount                  int             `db:"amount" json:"amount"`
	Balance                 int             `db:"balance" json:"balance"`
	BudgetTransactionAmount int             `db:"budget_transaction_amount" json:"budgetTransactionAmount"`
	BudgetCategory          BudgetCategory  `db:"-" json:"budgetCategory"`
	Created                 time.Time       `db:"created" format:"date-time" json:"created"`
	YearMonth               types.YearMonth `db:"year_month" json:"yearMonth" swaggertype:"integer"`
} // @Name BudgetMonthCategory

// BudgetMonthCategories is multiple BudgetMonthCategory.
type BudgetMonthCategories []BudgetMonthCategory

// BudgetMonthCategoriesRollup queries a database for BudgetMonthCategories and rolls them into one.
func BudgetMonthCategoriesRollup(ctx context.Context) {
	ctx = logger.Trace(ctx)

	//nolint:errcheck
	logger.Error(ctx, db.Exec(ctx, fmt.Sprintf(`
WITH deleted AS (
	DELETE FROM budget_month_category
	WHERE year_month < %[1]d
	RETURNING *
)
INSERT INTO budget_month_category (
	  auth_household_id
	, budget_category_id
	, amount
	, budget_transaction_amount
	, year_month
)
SELECT
	  auth_household_id
	, budget_category_id
	, SUM(amount)
	, SUM(budget_transaction_amount)
	, '%[1]d'
FROM deleted
GROUP BY
	  auth_household_id
	, budget_category_id
HAVING
	SUM(amount) != 0
	OR SUM(budget_transaction_amount) != 0
ON CONFLICT (auth_household_id, budget_category_id, year_month)
DO UPDATE
SET
	  amount = excluded.amount
	, budget_transaction_amount = excluded.budget_transaction_amount
`, types.CivilDateToday().AddMonths(-1*c.App.RollupBudgetTransactionsBalanceMonths).YearMonth().Int()), nil))
}

// Create adds a BudgetMonthCategory to a database.
func (b *BudgetMonthCategory) Create(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Error(ctx, db.Query(ctx, false, b, `
INSERT INTO budget_month_category (
	  amount
	, auth_household_id
	, budget_category_id
	, year_month
) VALUES (
	  :amount
	, :auth_household_id
	, :budget_category_id
	, :year_month
)
RETURNING *
`, b))
}

// Read returns a BudgetMonthCategory from a database.
func (b *BudgetMonthCategory) Read(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get month category
	return logger.Error(ctx, db.Query(ctx, false, b, `
SELECT *
FROM budget_month_category
WHERE auth_household_id  = :auth_household_id 
AND budget_category_id  = :budget_category_id
AND year_month = :year_month
`, b))
}

// Update updates a BudgetMonthCategory record.
func (b *BudgetMonthCategory) Update(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, b, `
UPDATE budget_month_category
SET amount = :amount
WHERE auth_household_id = :auth_household_id
AND budget_category_id = :budget_category_id
AND year_month = :year_month
RETURNING *
`, b))
}

// Scan reads in a BudgetMonthCategories from a database.
func (b *BudgetMonthCategories) Scan(src any) error {
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
