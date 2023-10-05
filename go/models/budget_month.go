package models

import (
	"context"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetMonth defines month fields.
type BudgetMonth struct {
	AuthHouseholdID                        uuid.UUID             `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	BudgetMonthCategoryAmount              int                   `db:"budget_month_category_amount" json:"budgetMonthCategoryAmount"`
	BudgetTransactionAmountIncomeRemaining int                   `db:"budget_transaction_amount_income_remaining" json:"budgetTransactionAmountIncomeRemaining"`
	BudgetTransactionAmountIncome          int                   `db:"budget_transaction_amount_income" json:"budgetTransactionAmountIncome"`
	BudgetMonthCategories                  BudgetMonthCategories `db:"budget_month_categories" json:"budgetMonthCategories"`
	YearMonth                              types.YearMonth       `db:"year_month" json:"yearMonth" swaggertype:"integer"`
} // @Name BudgetMonth

// BudgetMonths is multiple BudgetMonths.
type BudgetMonths []BudgetMonth

// BudgetMonthsDelete deletes unused BudgetMonths from a database.
func BudgetMonthsDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	//nolint:errcheck
	logger.Error(ctx, db.Exec(ctx, `
DELETE FROM budget_month
WHERE
	budget_month_category_amount = 0
	AND budget_month_category_amount = 0
	AND budget_transaction_amount_income = 0
`, nil))
}

// Read returns a BudgetMonth from a database.
func (b *BudgetMonth) Read(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get meals
	return logger.Error(ctx, db.Query(ctx, false, b, `
SELECT
	  JSON_AGG(
			JSON_BUILD_OBJECT(
				  'amount', month_category.amount
				, 'authHouseholdID', budget_category.auth_household_id
				, 'balance', month_category.balance
				, 'budgetCategory', json_build_object(
					  'authHouseholdID', budget_category.auth_household_id
					, 'income', budget_category.income
					, 'grouping', budget_category.grouping
					, 'name', budget_category.name
					, 'shortID', budget_category.short_id
					, 'targetAmount', budget_category.target_amount
					, 'targetMonth', budget_category.target_month
					, 'targetYear', budget_category.target_year
					)
				, 'budgetCategoryID', budget_category.id
				, 'budgetTransactionAmount', month_category.budget_transaction_amount
				, 'created', budget_category.created
				, 'yearMonth', coalesce(month_category.year_month, 0)
			)
		) AS budget_month_categories
	, COALESCE(MIN(month.budget_month_category_amount), 0) AS budget_month_category_amount
	, COALESCE(MIN(month.budget_transaction_amount_income), 0) AS budget_transaction_amount_income
	, COALESCE(MIN(month.budget_transaction_amount_income_remaining), 0) AS budget_transaction_amount_income_remaining
	, COALESCE(MIN(month.year_month), 0) AS year_month
FROM budget_category
FULL OUTER JOIN (
	SELECT DISTINCT ON (budget_category_id)
		  amount
		, auth_household_id
		, budget_category_id
		, budget_transaction_amount
		, year_month
		, SUM(
			amount
			+ budget_transaction_amount
		) OVER (
			PARTITION BY budget_category_id
			ORDER BY year_month
		) AS balance
	FROM budget_month_category
	WHERE auth_household_id = :auth_household_id
	AND year_month <= :year_month
	ORDER BY
		budget_category_id,
		year_month DESC
) AS month_category
ON budget_category.id = month_category.budget_category_id
FULL JOIN (
	SELECT DISTINCT ON (auth_household_id)
		  budget_month_category_amount
		, budget_transaction_amount_income
		, SUM(
  		budget_transaction_amount_income
  		- budget_month_category_amount
  	) OVER (
  		ORDER BY year_month
		) AS budget_transaction_amount_income_remaining
		, year_month
	FROM budget_month
	WHERE auth_household_id = :auth_household_id
	AND year_month <= :year_month
	ORDER BY
		auth_household_id,
		year_month DESC
) AS month ON TRUE
WHERE budget_category.auth_household_id = :auth_household_id
GROUP BY budget_category.auth_household_id
`, b))
}
