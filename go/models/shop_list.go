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

// ShopList defines list fields.
type ShopList struct {
	Created          time.Time         `db:"created" format:"date-time" json:"created"`
	Updated          time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthAccountID    *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID  *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	BudgetCategoryID *uuid.UUID        `db:"budget_category_id" format:"uuid" json:"budgetCategoryID"`
	ID               uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Icon             types.StringLimit `db:"icon" json:"icon"`
	Name             types.StringLimit `db:"name" json:"name"`
	ShopItemCount    int               `db:"shop_item_count" json:"shopItemCount"`
	ShortID          types.Nanoid      `db:"short_id" json:"shortID"`
} // @Name ShopList

func (s *ShopList) SetID(id uuid.UUID) {
	s.ID = id
}

// Create adds a ShopList to a database.
func (s *ShopList) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	s.ID = GenerateUUID()

	if !opts.Restore || s.ShortID == "" {
		s.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, s, `
INSERT INTO shop_list (
	  auth_account_id
	, auth_household_id
	, budget_category_id
	, icon
	, id
	, name
	, short_id
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :budget_category_id
	, :icon
	, :id
	, :name
	, :short_id
)
RETURNING *
`, s))
}

func (s *ShopList) getChange(_ context.Context) string {
	if s.AuthHouseholdID != nil {
		return string(s.Name)
	}

	return ""
}

func (s *ShopList) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return s.AuthAccountID, s.AuthHouseholdID, &s.ID
}

func (*ShopList) getType() modelType {
	return modelShopList
}

func (s *ShopList) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case s.AuthAccountID != nil && authAccountID != nil:
		s.AuthAccountID = authAccountID
	case s.AuthHouseholdID != nil && authHouseholdID != nil:
		s.AuthHouseholdID = authHouseholdID
	default:
		s.AuthAccountID = authAccountID
		s.AuthHouseholdID = authHouseholdID
	}
}

// Update updates a ShopList record.
func (s *ShopList) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE shop_list
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, budget_category_id = :budget_category_id
	, icon = :icon
	, name = :name
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs().String())

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, s, query, s))
}

// ShopLists is multiple ShopList.
type ShopLists []ShopList

func (*ShopLists) getType() modelType {
	return modelShopList
}

// ShopListsInitHousehold adds default household lists to the database.
func ShopListsInitHousehold(ctx context.Context, authHouseholdID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	lists := ShopLists{
		{
			AuthHouseholdID: &authHouseholdID,
			Name:            "Household Wishlist",
		},
	}

	for i := range lists {
		if err := lists[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}

// ShopListsInitPersonal adds default personal lists to the database.
func ShopListsInitPersonal(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	lists := ShopLists{
		{
			AuthAccountID: &authAccountID,
			Name:          "Personal Wishlist",
		},
	}

	for i := range lists {
		if err := lists[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
