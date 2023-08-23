package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetPayee defines payee fields.
type BudgetPayee struct {
	Created                 time.Time         `db:"created" format:"date-time" json:"created"`
	Updated                 time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID         uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	BudgetCategoryID        *uuid.UUID        `db:"budget_category_id" format:"uuid" json:"budgetCategoryID"`
	ID                      uuid.UUID         `db:"id" format:"uuid" json:"id"`
	ShopStore               bool              `db:"shop_store" json:"shopStore"`
	BudgetTransactionAmount int               `db:"budget_transaction_amount" json:"budgetTransactionAmount"`
	ShortID                 types.Nanoid      `db:"short_id" json:"shortID"`
	Address                 types.StringLimit `db:"address" json:"address"`
	Icon                    types.StringLimit `db:"icon" json:"icon"`
	Name                    types.StringLimit `db:"name" json:"name"`
} // @Name BudgetPayee

func (b *BudgetPayee) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetPayee) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	if !opts.Restore || b.ShortID == "" {
		b.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, b, `
WITH payee AS (
	INSERT INTO budget_payee (
		  address
		, auth_household_id
		, budget_category_id
		, icon
		, id
		, name
		, shop_store
		, short_id
	) VALUES (
		  :address
		, :auth_household_id
		, :budget_category_id
		, :icon
		, :id
		, :name
		, :shop_store
		, :short_id
	) ON CONFLICT DO NOTHING
	RETURNING *
)
SELECT *
FROM payee
UNION
	SELECT *
	FROM budget_payee
	WHERE auth_household_id = :auth_household_id
	AND name = :name
`, b))
}

func (b *BudgetPayee) getChange(_ context.Context) string {
	return string(b.Name)
}

func (b *BudgetPayee) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetPayee) getType() modelType {
	return modelBudgetPayee
}

func (b *BudgetPayee) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetPayee) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, `
UPDATE budget_payee
SET
	  address = :address
	, budget_category_id = :budget_category_id
	, icon = :icon
	, name = :name
	, shop_store = :shop_store
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, b))
}

// UpdateBudgetCategoryID updates a BudgetPayee BudgetCategoryID.
func (b *BudgetPayee) UpdateBudgetCategoryID(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, `
UPDATE budget_payee
SET
	budget_category_id = :budget_category_id
WHERE id = :id
AND auth_household_id = :auth_household_id
AND budget_category_id IS NULL
RETURNING *
`, b))
}

// BudgetPayees is multiple BudgetPayee.
type BudgetPayees []BudgetPayee

func (*BudgetPayees) getType() modelType {
	return modelBudgetPayee
}

// BudgetPayeesDelete deletes unused BudgetPayees from a database.
func BudgetPayeesDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	//nolint:errcheck
	logger.Log(ctx, db.Exec(ctx, `
DELETE FROM budget_payee
WHERE
	NOT EXISTS (
		SELECT 1
		FROM budget_transaction
		WHERE budget_payee_id = budget_payee.id
	)
	AND NOT shop_store
`, nil))
}
