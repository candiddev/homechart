package models

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

const budgetTransactionAccountJSON = `
	JSON_AGG(
		JSON_BUILD_OBJECT(
			'amount', amount,
			'authHouseholdID', auth_household_id,
			'budgetAccountID', budget_account_id,
			'budgetTransactionID', budget_transaction_id,
			'id', id,
			'status', status
		)
	) AS accounts
`

const budgetTransactionCategoryJSON = `
	JSON_AGG(
		JSON_BUILD_OBJECT(
			'amount', amount,
			'authHouseholdID', auth_household_id,
			'budgetCategoryID', budget_category_id,
			'budgetTransactionID', budget_transaction_id,
			'id', id,
			'yearMonth', year_month
		)
	) AS categories
`

const budgetTransactionInsert = `
INSERT INTO budget_transaction (
	  amount
	, auth_household_id
	, budget_payee_id
	, date
	, id
	, keep
	, note
) VALUES (
		:amount
	, :auth_household_id
	, :budget_payee_id
	, :date
	, :id
	, :keep
	, :note
)
`

// ErrBudgetTransactionAccounts means a transaction has no accounts.
var ErrBudgetTransactionAccounts = errs.NewClientBadRequestErr("Transactions must have at least 1 account")

// ErrBudgetTransactionBalanceAccountAmount means a transaction doesn't balance.
var ErrBudgetTransactionBalanceAccountAmount = errs.NewClientBadRequestErr("The transaction amount for one of your accounts must match your categories")

// ErrBudgetTransactionBalanceAccounts means a transaction doesn't balance.
var ErrBudgetTransactionBalanceAccounts = errs.NewClientBadRequestErr("The transaction amount for all of your accounts must equal zero")

// ErrBudgetTransactionBalanceCategoryAmount means a transaction doesn't balance.
var ErrBudgetTransactionBalanceCategoryAmount = errs.NewClientBadRequestErr("The transaction amount must match your categories")

// ErrBudgetTransactionPayee means a transaction has a payee but no category.
var ErrBudgetTransactionPayee = errs.NewClientBadRequestErr("Transactions with a payee must be categorized")

// BudgetTransaction defines transaction fields.
type BudgetTransaction struct {
	BudgetPayeeID   *uuid.UUID                  `db:"budget_payee_id" format:"uuid" json:"budgetPayeeID"`
	AuthHouseholdID uuid.UUID                   `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	Created         time.Time                   `db:"created" format:"date-time" json:"created"`
	ID              *uuid.UUID                  `db:"id" format:"date-time" json:"id"`
	Date            types.CivilDate             `db:"date" format:"date" json:"date" swaggertype:"string"`
	Keep            bool                        `db:"keep" json:"keep"`
	Amount          int                         `db:"amount" json:"amount"`
	Balance         int                         `db:"balance" json:"balance"`
	BudgetPayeeName types.StringLimit           `db:"-" json:"budgetPayeeName"`
	Note            types.StringLimit           `db:"note" json:"note"`
	Accounts        BudgetTransactionAccounts   `db:"accounts" json:"accounts"`
	Categories      BudgetTransactionCategories `db:"categories" json:"categories"`
} // @Name BudgetTransaction

type budgetTransactionsRollup struct {
	AuthHouseholdID uuid.UUID                   `db:"auth_household_id"`
	BudgetPayeeID   *uuid.UUID                  `db:"budget_payee_id"`
	Date            types.CivilDate             `db:"date"`
	IDs             types.SliceString           `db:"ids"`
	Accounts        BudgetTransactionAccounts   `db:"accounts"`
	Categories      BudgetTransactionCategories `db:"categories"`
}

func budgetTransactionsCreateRollup(ctx context.Context, transactions []budgetTransactionsRollup, startingBalance bool) (added, deleted int) { //nolint:gocognit
	ctx = logger.Trace(ctx)

	var wg sync.WaitGroup

	var mu sync.Mutex

	addCount := atomic.Int32{}
	deleteCount := atomic.Int32{}

	wg.Add(len(transactions))

	for i := 0; i < len(transactions); i++ {
		go func(i int) {
			defer wg.Done()

			bas := map[string]*BudgetTransactionAccount{}
			bcs := map[string]*BudgetTransactionCategory{}

			id := GenerateUUID()

			bt := BudgetTransaction{
				Accounts:        BudgetTransactionAccounts{},
				AuthHouseholdID: transactions[i].AuthHouseholdID,
				BudgetPayeeID:   transactions[i].BudgetPayeeID,
				Categories:      BudgetTransactionCategories{},
				ID:              &id,
			}

			if startingBalance {
				bt.Date = types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 1))
				bt.Note = "Starting Balance"
			} else {
				bt.Date = transactions[i].Date
				bt.Note = types.StringLimit(fmt.Sprintf("%s %d Roll Up", transactions[i].Date.Month, transactions[i].Date.Year))
			}

			for _, account := range transactions[i].Accounts {
				if account.BudgetAccountID != nil {
					key := account.BudgetAccountID.String()

					if acct, ok := bas[key]; ok {
						acct.Amount += account.Amount

						if !startingBalance && acct.Status < account.Status {
							acct.Status = account.Status
						}
					} else {
						bas[key] = &BudgetTransactionAccount{
							Amount:              account.Amount,
							AuthHouseholdID:     bt.AuthHouseholdID,
							BudgetAccountID:     account.BudgetAccountID,
							BudgetTransactionID: bt.ID,
							ID:                  GenerateUUID(),
						}

						if startingBalance {
							bas[key].Status = BudgetTransactionAccountStatusReconciled
						} else {
							bas[key].Status = account.Status
						}
					}
				}
			}

			for _, category := range transactions[i].Categories {
				if category.BudgetCategoryID != nil {
					var key string

					if startingBalance {
						key = category.BudgetCategoryID.String()
					} else {
						key = fmt.Sprintf("%s-%d", category.BudgetCategoryID, category.YearMonth)
					}

					if cat, ok := bcs[key]; ok {
						cat.Amount += category.Amount
					} else {
						bcs[key] = &BudgetTransactionCategory{
							Amount:              category.Amount,
							AuthHouseholdID:     bt.AuthHouseholdID,
							BudgetCategoryID:    category.BudgetCategoryID,
							BudgetTransactionID: bt.ID,
							ID:                  GenerateUUID(),
						}

						if startingBalance {
							bcs[key].YearMonth = types.CivilDateToday().AddMonths(-1 * (c.App.RollupBudgetTransactionsBalanceMonths + 1)).YearMonth()
						} else {
							bcs[key].YearMonth = category.YearMonth
						}
					}
				}
			}

			mu.Lock()
			defer mu.Unlock()

			tx, err := db.BeginTx(ctx)
			if err != nil {
				logger.Log(ctx, err) //nolint:errcheck

				return
			}

			if _, err := tx.NamedExec(budgetTransactionInsert, bt); err != nil {
				logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

				return
			}

			addCount.Add(1)

			for _, account := range bas {
				if account.Amount != 0 {
					if _, err := tx.NamedExec(budgetTransactionAccountInsert, account); err != nil {
						logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

						return
					}
				}
			}

			for _, category := range bcs {
				if category.Amount != 0 {
					if _, err := tx.NamedExec(budgetTransactionCategoryInsert, category); err != nil {
						logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

						return
					}
				}
			}

			if _, err := tx.Exec(fmt.Sprintf(`DELETE FROM budget_transaction WHERE id IN ('%s')`, strings.Join(transactions[i].IDs, "', '"))); err != nil {
				logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

				return
			}

			deleteCount.Add(int32(len(transactions[i].IDs)))

			if err := tx.Commit(); err != nil {
				logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

				return
			}
		}(i)
	}

	wg.Wait()

	logger.Log(ctx, nil) //nolint:errcheck

	return int(addCount.Load()), int(deleteCount.Load())
}

// BudgetTransactionsReadAccount queries a database for BudgetTransactions for a BudgetAccount.
func BudgetTransactionsReadAccount(ctx context.Context, budgetAccountID uuid.UUID, offset int, limit int) (BudgetTransactions, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get Transactions
	b := BudgetTransactions{}

	var total int

	if limit == 0 {
		limit = 50
	}

	err := db.Query(ctx, true, &b, fmt.Sprintf(`
WITH account_filtered AS (
	SELECT
		  amount
		, budget_transaction_id
	FROM budget_transaction_account
	WHERE budget_account_id = $1
)
SELECT
	  SUM(account_filtered.amount) OVER (
		ORDER BY
			  budget_transaction.date
			, budget_transaction.created
		) AS balance
	, budget_transaction.*
	, budget_transaction_account.accounts
	, budget_transaction_category.categories
FROM budget_transaction
LEFT JOIN account_filtered ON budget_transaction.id = account_filtered.budget_transaction_id
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionAccountJSON+`
	FROM budget_transaction_account
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_account ON TRUE
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionCategoryJSON+`
	FROM budget_transaction_category
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_category ON TRUE
WHERE budget_transaction.id IN (SELECT budget_transaction_id FROM account_filtered)
ORDER BY
	  budget_transaction.date desc
	, budget_transaction.created desc
limit %d
offset $2
`, limit), nil, budgetAccountID, offset)
	if err != nil {
		return b, total, logger.Log(ctx, err)
	}

	err = db.Query(ctx, false, &total, `
SELECT count(id)
FROM budget_transaction
WHERE budget_transaction.id IN (
	SELECT
		budget_transaction_id
	FROM budget_transaction_account
	WHERE budget_account_id = $1
)
`, nil, budgetAccountID)

	return b, total, logger.Log(ctx, err)
}

// BudgetTransactionsReadCategory queries a database for BudgetTransactions for a BudgetCategory.
func BudgetTransactionsReadCategory(ctx context.Context, budgetCategoryID uuid.UUID, offset int) (BudgetTransactions, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get Transactions
	b := BudgetTransactions{}

	var total int

	err := db.Query(ctx, true, &b, `
WITH category_filtered AS (
	SELECT
		amount,
		budget_transaction_id
	FROM budget_transaction_category
	WHERE budget_category_id = $1
)
SELECT
	  SUM(category_filtered.amount) OVER (
		ORDER BY
			  budget_transaction.date
			, budget_transaction.created
		) AS balance
	, budget_transaction.*
	, budget_transaction_account.accounts
	, budget_transaction_category.categories
FROM budget_transaction
LEFT JOIN category_filtered
ON budget_transaction.id = category_filtered.budget_transaction_id
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionAccountJSON+`
	FROM budget_transaction_account
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_account ON true
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionCategoryJSON+`
	FROM budget_transaction_category
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_category ON TRUE
WHERE budget_transaction.id IN (SELECT budget_transaction_id FROM category_filtered)
ORDER BY
	  budget_transaction.date desc
	, budget_transaction.created desc
LIMIT 50
OFFSET $2
`, nil, budgetCategoryID, offset)
	if err != nil {
		return b, total, logger.Log(ctx, err)
	}

	err = db.Query(ctx, false, &total, `
SELECT COUNT(id)
FROM budget_transaction
WHERE budget_transaction.id IN (
	SELECT budget_transaction_id
	FROM budget_transaction_category
	WHERE budget_category_id = $1
)
`, nil, budgetCategoryID)

	return b, total, logger.Log(ctx, err)
}

// BudgetTransactionsReadCategoryMonth queries a database for BudgetTransactions for a BudgetCategory BudgetMonth.
func BudgetTransactionsReadCategoryMonth(ctx context.Context, budgetCategoryID uuid.UUID, yearMonth types.YearMonth, offset int) (BudgetTransactions, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get Transactions
	b := BudgetTransactions{}

	var total int

	err := db.Query(ctx, true, &b, `
WITH category_filtered AS (
	SELECT
		  amount
		, budget_transaction_id
	FROM budget_transaction_category
	WHERE budget_category_id = $1
	AND year_month = $2
)
SELECT
	  SUM(category_filtered.amount) OVER (
			ORDER BY
				  budget_transaction.date
				, budget_transaction.created asc
		) AS balance
	, budget_transaction.*
	, budget_transaction_account.accounts
	, budget_transaction_category.categories
FROM budget_transaction
LEFT JOIN category_filtered ON budget_transaction.id = category_filtered.budget_transaction_id
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionAccountJSON+`
	FROM budget_transaction_account
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_account ON TRUE
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionCategoryJSON+`
	FROM budget_transaction_category
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_category ON TRUE
WHERE budget_transaction.id IN (select budget_transaction_id from category_filtered)
ORDER BY
		budget_transaction.date desc
	, budget_transaction.created desc
LIMIT 50
OFFSET $3
`, nil, budgetCategoryID, yearMonth, offset)
	if err != nil {
		return b, total, logger.Log(ctx, err)
	}

	err = db.Query(ctx, false, &total, `
SELECT COUNT(id)
FROM budget_transaction
WHERE budget_transaction.id IN (
	SELECT budget_transaction_id
	FROM budget_transaction_category
	WHERE budget_category_id = $1
	AND year_month = $2
)
`, nil, budgetCategoryID, yearMonth)

	return b, total, logger.Log(ctx, err)
}

// BudgetTransactionsReadPayee queries a database for BudgetTransactions for a BudgetPayee.
func BudgetTransactionsReadPayee(ctx context.Context, budgetPayeeID uuid.UUID, offset int) (BudgetTransactions, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get Transactions
	b := BudgetTransactions{}

	var total int

	err := db.Query(ctx, true, &b, `
SELECT
	SUM(budget_transaction.amount) OVER (
		ORDER BY
			  budget_transaction.date
			, budget_transaction.created
		) AS balance
	, budget_transaction.*
	, budget_transaction_account.accounts
	, budget_transaction_category.categories
FROM budget_transaction
LEFT join lateral (
	SELECT
		`+budgetTransactionAccountJSON+`
	FROM budget_transaction_account
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_account ON TRUE
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionCategoryJSON+`
	FROM budget_transaction_category
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_category ON TRUE
WHERE budget_transaction.budget_payee_id = $1
ORDER BY
	  budget_transaction.date desc
	, budget_transaction.created desc
LIMIT 50
OFFSET $2
`, nil, budgetPayeeID, offset)
	if err != nil {
		return b, total, logger.Log(ctx, err)
	}

	err = db.Query(ctx, false, &total, `
SELECT COUNT(id)
FROM budget_transaction
WHERE budget_transaction.budget_payee_id = $1
`, nil, budgetPayeeID)

	return b, total, logger.Log(ctx, err)
}

// BudgetTransactionsRollupBalance queries a database for BudgetTransactions and rolls them into a starting balance.
func BudgetTransactionsRollupBalance(ctx context.Context) (added, deleted int) {
	ctx = logger.Trace(ctx)

	btr := []budgetTransactionsRollup{}

	err := db.Query(ctx, true, &btr, fmt.Sprintf(`
SELECT
	  budget_transaction.auth_household_id
	, array_agg(distinct(budget_transaction.id)) as ids
	, json_agg(
			DISTINCT(
					jsonb_build_object(
					  'amount', budget_transaction_account.amount
					, 'budgetAccountID', budget_transaction_account.budget_account_id
					, 'id', budget_transaction_account.id
				)
			)
		) as accounts
	, json_agg(
			DISTINCT(
				jsonb_build_object(
					  'amount', budget_transaction_category.amount
					, 'budgetCategoryID', budget_transaction_category.budget_category_id
					, 'id', budget_transaction_category.id
				)
			)
		)
		FILTER (
			WHERE budget_transaction_category.id IS NOT NULL
		) as categories
FROM budget_transaction
LEFT JOIN budget_transaction_account ON budget_transaction.id = budget_transaction_account.budget_transaction_id
LEFT JOIN budget_transaction_category ON budget_transaction.id = budget_transaction_category.budget_transaction_id
WHERE
	date_trunc('month', budget_transaction.date) < date_trunc('month', now()) - interval '%d months'
	AND NOT keep
GROUP BY
	  budget_transaction.auth_household_id
HAVING count(distinct(budget_transaction.id)) > 1
LIMIT 10000`, c.App.RollupBudgetTransactionsBalanceMonths), nil)
	if err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return added, deleted
	}

	added, deleted = budgetTransactionsCreateRollup(ctx, btr, true)

	logger.Log(ctx, err) //nolint:errcheck

	return added, deleted
}

// BudgetTransactionsRollupSummary queries a database for BudgetTransactions and creates monthly summary values for them.
func BudgetTransactionsRollupSummary(ctx context.Context) (added, deleted int) {
	ctx = logger.Trace(ctx)

	btr := []budgetTransactionsRollup{}

	err := db.Query(ctx, true, &btr, fmt.Sprintf(`
SELECT
	  budget_transaction.auth_household_id
	, date_trunc('month', budget_transaction.date) as date
	, budget_transaction.budget_payee_id
	, array_agg(distinct(budget_transaction.id)) as ids
	, json_agg(
			DISTINCT(
					jsonb_build_object(
					  'amount', budget_transaction_account.amount
					, 'budgetAccountID', budget_transaction_account.budget_account_id
					, 'id', budget_transaction_account.id
					, 'status', budget_transaction_account.status
				)
			)
		) as accounts
	, json_agg(
			DISTINCT(
				jsonb_build_object(
					  'amount', budget_transaction_category.amount
					, 'budgetCategoryID', budget_transaction_category.budget_category_id
					, 'id', budget_transaction_category.id
					, 'yearMonth', budget_transaction_category.year_month
				)
			)
		)
		FILTER (
			WHERE budget_transaction_category.id IS NOT NULL
		) as categories
FROM budget_transaction
LEFT JOIN budget_transaction_account ON budget_transaction.id = budget_transaction_account.budget_transaction_id
LEFT JOIN budget_transaction_category ON budget_transaction.id = budget_transaction_category.budget_transaction_id
WHERE
	date_trunc('month', budget_transaction.date) < date_trunc('month', now()) - interval '%d months'
	AND NOT keep
GROUP BY
	  budget_transaction.auth_household_id
	, date_trunc('month', date)
	, budget_transaction.budget_payee_id
HAVING count(distinct(budget_transaction.id)) > 1
ORDER BY date_trunc('month', budget_transaction.date) desc
LIMIT 10000`, c.App.RollupBudgetTransactionsSummaryMonths), nil)
	if err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return added, deleted
	}

	added, deleted = budgetTransactionsCreateRollup(ctx, btr, false)

	logger.Log(ctx, err) //nolint:errcheck

	return added, deleted
}

func (b *BudgetTransaction) SetID(id uuid.UUID) {
	b.ID = &id
}

func (b *BudgetTransaction) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	id := GenerateUUID()
	b.ID = &id

	err := db.Query(ctx, false, b, budgetTransactionInsert+`
RETURNING *
`, b)

	if err != nil {
		return logger.Log(ctx, err)
	}

	for i := range b.Accounts {
		b.Accounts[i].AuthHouseholdID = b.AuthHouseholdID
		b.Accounts[i].BudgetTransactionID = b.ID
		err = b.Accounts[i].create(ctx, CreateOpts{})

		if err != nil {
			return logger.Log(ctx, err)
		}
	}

	for i := range b.Categories {
		if len(b.Categories) == 1 && b.BudgetPayeeID != nil {
			bp := BudgetPayee{
				ID:               *b.BudgetPayeeID,
				AuthHouseholdID:  b.AuthHouseholdID,
				BudgetCategoryID: b.Categories[i].BudgetCategoryID,
			}

			err = bp.UpdateBudgetCategoryID(ctx)

			if err != nil && !errors.Is(err, errs.ErrClientNoContent) {
				return logger.Log(ctx, err)
			}
		}

		b.Categories[i].AuthHouseholdID = b.AuthHouseholdID
		b.Categories[i].BudgetTransactionID = b.ID
		err = b.Categories[i].create(ctx, CreateOpts{})

		if err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, err)
}

func (*BudgetTransaction) getChange(_ context.Context) string {
	return ""
}

func (b *BudgetTransaction) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, b.ID
}

func (*BudgetTransaction) getType() modelType {
	return modelBudgetTransaction
}

func (b *BudgetTransaction) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetTransaction) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, `
UPDATE budget_transaction
SET
	  amount = :amount
	, budget_payee_id = :budget_payee_id
	, date = :date
	, keep = :keep
	, note = :note
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, b))
}

// Read queries a database for a BudgetTransaction matching an AuthHouseholdID.
func (b *BudgetTransaction) Read(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get transaction
	return logger.Log(ctx, db.Query(ctx, false, b, `
SELECT
	  budget_transaction.*
	, budget_transaction_account.accounts
	, budget_transaction_category.categories
FROM budget_transaction
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionAccountJSON+`
	FROM budget_transaction_account
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_account ON TRUE
LEFT JOIN LATERAL (
	SELECT
		`+budgetTransactionCategoryJSON+`
	from budget_transaction_category
	WHERE budget_transaction_id = budget_transaction.id
) budget_transaction_category ON TRUE
WHERE budget_transaction.auth_household_id = :auth_household_id
AND budget_transaction.id = :id
`, b))
}

// Validate verifies a BudgetTransaction is correct.
func (b BudgetTransaction) Validate() errs.Err { //nolint:gocognit
	if len(b.Accounts) == 0 && len(b.Categories) == 0 {
		return errs.ErrClientBadRequestProperty
	}

	if len(b.Accounts) > 2 {
		return ErrBudgetTransactionAccounts
	}

	if (b.BudgetPayeeID != nil || b.BudgetPayeeName != "") && len(b.Categories) == 0 {
		return ErrBudgetTransactionPayee
	}

	categoryAmount := 0

	for _, category := range b.Categories {
		categoryAmount += category.Amount
	}

	accountAmount := 0
	matchCategory := false

	for _, account := range b.Accounts {
		accountAmount += account.Amount

		if account.Amount == categoryAmount {
			matchCategory = true
		}
	}

	// Check if payees are filled in and the amounts match
	if len(b.Accounts) == 1 && (b.BudgetPayeeName != "" || b.BudgetPayeeID != nil) { //nolint: gocritic
		if accountAmount != categoryAmount {
			return ErrBudgetTransactionBalanceAccountAmount
		} else if categoryAmount != b.Amount {
			return ErrBudgetTransactionBalanceCategoryAmount
		}
	} else if len(b.Categories) == 0 && len(b.Accounts) > 1 && (accountAmount != 0 || b.Amount != 0) {
		return ErrBudgetTransactionBalanceAccounts
	} else if len(b.Categories) > 0 {
		if accountAmount != 0 { //nolint: gocritic
			return ErrBudgetTransactionBalanceAccounts
		} else if !matchCategory {
			return ErrBudgetTransactionBalanceAccountAmount
		} else if categoryAmount != b.Amount {
			return ErrBudgetTransactionBalanceCategoryAmount
		}
	}

	return nil
}

// BudgetTransactions is multiple BudgetTransaction.
type BudgetTransactions []BudgetTransaction
