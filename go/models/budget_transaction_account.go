package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// BudgetTransactionAccountStatus represents an account status.
type BudgetTransactionAccountStatus int

// BudgetTransactionAccountStatus represents an account status.
const (
	BudgetTransactionStatusUncleared BudgetTransactionAccountStatus = iota
	BudgetTransactionAccountStatusCleared
	BudgetTransactionAccountStatusReconciled
)

const budgetTransactionAccountInsert = `
INSERT INTO budget_transaction_account (
	  amount
	, auth_household_id
	, budget_account_id
	, budget_transaction_id
	, id
	, status
) VALUES (
	  :amount
	, :auth_household_id
	, :budget_account_id
	, :budget_transaction_id
	, :id
	, :status
)
`

// BudgetTransactionAccount maps accounts to a transaction.
type BudgetTransactionAccount struct {
	BudgetAccountID     *uuid.UUID                     `db:"budget_account_id" format:"uuid" json:"budgetAccountID"`
	BudgetTransactionID *uuid.UUID                     `db:"budget_transaction_id" format:"uuid" json:"budgetTransactionID"`
	AuthHouseholdID     uuid.UUID                      `db:"auth_household_id" json:"authHouseholdID"`
	ID                  uuid.UUID                      `db:"id" format:"uuid" json:"id"`
	Status              BudgetTransactionAccountStatus `db:"status" json:"status"`
	Amount              int                            `db:"amount" json:"amount"`
} // @Name BudgetTransactionAccount

func (b *BudgetTransactionAccount) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetTransactionAccount) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, b, budgetTransactionAccountInsert+`
RETURNING *
`, b))
}

func (*BudgetTransactionAccount) getChange(_ context.Context) string {
	return ""
}

func (b *BudgetTransactionAccount) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetTransactionAccount) getType() modelType {
	return modelBudgetTransactionAccount
}

func (b *BudgetTransactionAccount) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetTransactionAccount) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, `
UPDATE budget_transaction_account
SET
	  amount = :amount
	, budget_account_id = :budget_account_id
	, status = :status
WHERE auth_household_id = :auth_household_id
AND id = :id
RETURNING *
`, b))
}

// BudgetTransactionAccounts is multiple BudgetTransactionAccount.
type BudgetTransactionAccounts []BudgetTransactionAccount

func (*BudgetTransactionAccounts) getType() modelType {
	return modelBudgetTransactionAccount
}

// Scan reads in a BudgetTransactionAccounts from a database.
func (b *BudgetTransactionAccounts) Scan(src any) error {
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

// Value converts a BudgetTransactionAccount to JSON.
func (b BudgetTransactionAccounts) Value() (driver.Value, error) {
	if len(b) == 0 {
		return []byte("[]"), nil
	}

	j, err := json.Marshal(b)

	return j, err
}

// BudgetTransactionAccountsReconcile sets the status for any cleared transaction for a BudgetAccountID to reconciled.
func BudgetTransactionAccountsReconcile(ctx context.Context, p PermissionsOpts, budgetAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &BudgetTransactionAccount{}, p)
	if err != nil {
		return logger.Log(ctx, err)
	}

	r := map[string]any{
		"auth_household_ids": f.AuthHouseholdIDs,
		"budget_account_id":  budgetAccountID,
	}

	return logger.Log(ctx, db.Exec(ctx, `
UPDATE budget_transaction_account
SET status = 2
WHERE auth_household_id = ANY(:auth_household_ids)
AND budget_account_id = :budget_account_id
AND status = 1
`, r))
}
