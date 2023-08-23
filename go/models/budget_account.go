package models

import (
	"context"
	"time"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetAccount defines account fields.
type BudgetAccount struct {
	Created                           time.Time         `db:"created" format:"date-time" json:"created"`
	Updated                           time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID                   uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID                                uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Icon                              types.StringLimit `db:"icon" json:"icon"`
	Name                              types.StringLimit `db:"name" json:"name"`
	BudgetTransactionAmount           int               `db:"budget_transaction_amount" json:"budgetTransactionAmount"`
	BudgetTransactionAmountCleared    int               `db:"budget_transaction_amount_cleared" json:"budgetTransactionAmountCleared"`
	BudgetTransactionAmountReconciled int               `db:"budget_transaction_amount_reconciled" json:"budgetTransactionAmountReconciled"`
	ShortID                           types.Nanoid      `db:"short_id" json:"shortID"`
	Budget                            bool              `db:"budget" json:"budget"`
	Hidden                            bool              `db:"hidden" json:"hidden"`
} // @Name BudgetAccount

func (b *BudgetAccount) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetAccount) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	if !opts.Restore || b.ShortID == "" {
		b.ShortID = types.NewNanoid()
	}

	err := logger.Log(ctx, db.Query(ctx, false, b, `
INSERT INTO budget_account (
	  auth_household_id
	, budget
	, hidden
	, icon
	, id
	, name
	, short_id
) VALUES (
	  :auth_household_id
	, :budget
	, :hidden
	, :icon
	, :id
	, :name
	, :short_id
)
RETURNING *
`, b))

	if err != nil {
		return err
	}

	bp := BudgetPayee{
		AuthHouseholdID: b.AuthHouseholdID,
		Name:            types.StringLimit(yaml8n.ObjectBudgetStartingBalance.Translate(GetISO639Code(ctx))),
	}

	if err := logger.Log(ctx, bp.create(ctx, CreateOpts{})); err != nil {
		return logger.Log(ctx, err)
	}

	bc := BudgetCategory{
		AuthHouseholdID: b.AuthHouseholdID,
		Grouping:        "",
		Income:          true,
		Name:            types.StringLimit(yaml8n.ObjectBudgetStartingBalance.Translate(GetISO639Code(ctx))),
	}

	if err := bc.create(ctx, opts); err != nil {
		return logger.Log(ctx, err)
	}

	date := types.CivilDateOf(GenerateTimestamp())

	bt := BudgetTransaction{
		Accounts: BudgetTransactionAccounts{
			{
				BudgetAccountID: &b.ID,
			},
		},
		AuthHouseholdID: b.AuthHouseholdID,
		BudgetPayeeID:   &bp.ID,
		Categories: BudgetTransactionCategories{
			{
				BudgetCategoryID: &bc.ID,
				YearMonth:        date.YearMonth(),
			},
		},
		Date: date,
	}

	return logger.Log(ctx, bt.create(ctx, CreateOpts{}))
}

func (b *BudgetAccount) getChange(_ context.Context) string {
	return string(b.Name)
}

func (b *BudgetAccount) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetAccount) getType() modelType {
	return modelBudgetAccount
}

func (b *BudgetAccount) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetAccount) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	err := db.Query(ctx, false, b, `
UPDATE budget_account 
SET
	  budget = :budget
	, hidden = :hidden
	, icon = :icon
	, name = :name
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, b)

	return logger.Log(ctx, err)
}

// BudgetAccounts is multiple BudgetAccount.
type BudgetAccounts []BudgetAccount

func (*BudgetAccounts) getType() modelType {
	return modelBudgetAccount
}

// BudgetAccountsInit adds default accounts to database for an AuthHouseholdID.
func BudgetAccountsInit(ctx context.Context, authHouseholdID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	accounts := BudgetAccounts{
		{
			Budget: true,
			Name:   types.StringLimit(yaml8n.ObjectBudgetAccountChecking.Translate(GetISO639Code(ctx))),
		},
		{
			Budget: true,
			Icon:   "savings",
			Name:   types.StringLimit(yaml8n.ObjectBudgetAccountSavings.Translate(GetISO639Code(ctx))),
		},
	}

	for _, account := range accounts {
		account.AuthHouseholdID = authHouseholdID

		if err := account.create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
