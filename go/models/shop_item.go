package models

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// ShopItem defines item fields.
type ShopItem struct {
	NextDate         *types.CivilDate  `db:"next_date"  format:"date" json:"nextDate" swaggertype:"string"`
	Recurrence       *types.Recurrence `db:"recurrence" json:"recurrence"`
	AuthAccountID    *uuid.UUID        `db:"auth_account_id" json:"authAccountID"`
	AuthHouseholdID  *uuid.UUID        `db:"auth_household_id" json:"authHouseholdID"`
	BudgetCategoryID *uuid.UUID        `db:"budget_category_id" json:"budgetCategoryID"`
	CookMealPlanID   *uuid.UUID        `db:"cook_meal_plan_id" json:"cookMealPlanID"`
	CookRecipeID     *uuid.UUID        `db:"cook_recipe_id" format:"uuid" json:"cookRecipeID"`
	PlanProjectID    *uuid.UUID        `db:"plan_project_id" json:"planProjectID"`
	ShopCategoryID   *uuid.UUID        `db:"shop_category_id" format:"uuid" json:"shopCategoryID"`
	ShopListID       *uuid.UUID        `db:"shop_list_id" format:"uuid" json:"shopListID"`
	BudgetPayeeID    *uuid.UUID        `db:"budget_payee_id" format:"uuid" json:"budgetPayeeID"`
	Created          time.Time         `db:"created" format:"date-time" json:"created"`
	Updated          time.Time         `db:"updated" format:"date-time" json:"updated"`
	ID               uuid.UUID         `db:"id" format:"uuid" json:"id"`
	InCart           bool              `db:"in_cart" json:"inCart"`
	Price            types.PositiveInt `db:"price" json:"price"`
	Name             types.StringLimit `db:"name" json:"name"`
	Position         types.Position    `db:"position" json:"position"`
} // @Name ShopItem

var stripSpecialCharacters = regexp.MustCompile(`[^\w]+`)

func (s *ShopItem) SetID(id uuid.UUID) {
	s.ID = id
}

func (s *ShopItem) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	s.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, s, `
INSERT INTO shop_item (
	  auth_account_id
	, auth_household_id
	, budget_payee_id
	, cook_meal_plan_id
	, cook_recipe_id
	, id
	, name
	, next_date
	, plan_project_id
	, position
	, price
	, recurrence
	, shop_category_id
	, shop_list_id
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :budget_payee_id
	, :cook_meal_plan_id
	, :cook_recipe_id
	, :id
	, :name
	, :next_date
	, :plan_project_id
	, :position
	, :price
	, :recurrence
	, :shop_category_id
	, :shop_list_id
)
RETURNING *
`, s))
}

func (s *ShopItem) getChange(_ context.Context) string {
	if s.AuthHouseholdID != nil {
		return string(s.Name)
	}

	return ""
}

func (s *ShopItem) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return s.AuthAccountID, s.AuthHouseholdID, &s.ID
}

func (*ShopItem) getType() modelType {
	return modelShopItem
}

func (s *ShopItem) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
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

func (s *ShopItem) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE shop_item
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, budget_payee_id = :budget_payee_id
	, cook_meal_plan_id = :cook_meal_plan_id
	, in_cart = :in_cart
	, name = :name
	, next_date = :next_date
	, plan_project_id = :plan_project_id
	, position = :position
	, price = :price
	, recurrence = :recurrence
	, shop_category_id = :shop_category_id
	, shop_list_id = :shop_list_id
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, s, query, s))
}

// ShopItems is multiple ShopItem.
type ShopItems []ShopItem

func (*ShopItems) getType() modelType {
	return modelShopItem
}

// ShopItemsReadAssistant reads all items for an assistant and returns a text prompt.
func ShopItemsReadAssistant(ctx context.Context, p PermissionsOpts, budgetPayeeName string) (speech, link string, list []string) {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &ShopItem{}, p)
	if err != nil {
		return speechForbidden, "", []string{}
	}

	filter := map[string]any{
		"auth_account_id":    f.AuthAccountID,
		"auth_household_ids": f.AuthHouseholdIDs,
		"budget_payee_name":  strings.ToLower(stripSpecialCharacters.ReplaceAllString(budgetPayeeName, "")),
	}

	query := `SELECT
	shop_item.name
FROM shop_item
LEFT JOIN budget_payee ON
	shop_item.budget_payee_id = budget_payee.id
WHERE (
	shop_item.auth_account_id = :auth_account_id
	OR shop_item.auth_household_id = ANY(:auth_household_ids)
)
AND shop_list_id IS NULL`

	var c string

	if budgetPayeeName != "" {
		query += ` AND lower(regexp_replace(budget_payee.name, '[^\w]+', '', 'g')) = :budget_payee_name`
		c = "from " + budgetPayeeName
	}

	query += " ORDER BY shop_item.name"

	var items []string

	err = db.Query(ctx, true, &items, query, filter)

	return toSpeechList(err, items, c, "shopping item", "/shop/items")
}
