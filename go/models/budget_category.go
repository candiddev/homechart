package models

import (
	"context"
	"encoding/json"
	"time"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// ErrBudgetCategory means an income category had goals.
var ErrBudgetCategory = errs.NewClientBadRequestErr("Income categories cannot have goals")

// BudgetCategory defines category fields.
type BudgetCategory struct {
	Created                   time.Time         `db:"created" format:"date-time" json:"created"`
	Updated                   time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID           uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID                        uuid.UUID         `db:"id" format:"uuid" json:"id"`
	TargetMonth               time.Month        `db:"target_month" json:"targetMonth" swaggertype:"integer"`
	Grouping                  types.StringLimit `db:"grouping" json:"grouping"`
	ShortID                   types.Nanoid      `db:"short_id" json:"shortID"`
	Name                      types.StringLimit `db:"name" json:"name"`
	Income                    bool              `db:"income" json:"income"`
	BudgetMonthCategoryAmount int               `db:"budget_month_category_amount" json:"budgetMonthCategoryAmount"`
	BudgetTransactionAmount   int               `db:"budget_transaction_amount" json:"budgetTransactionAmount"`
	TargetAmount              int               `db:"target_amount" json:"targetAmount"`
	TargetYear                int               `db:"target_year" json:"targetYear"`
} // @Name BudgetCategory

func (b *BudgetCategory) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *BudgetCategory) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	if !opts.Restore || b.ShortID == "" {
		b.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, b, `
WITH category AS (
	INSERT INTO budget_category (
		  auth_household_id
		, grouping
		, id
		, income
		, name
		, short_id
		, target_amount
		, target_month
		, target_year
	) VALUES (
		  :auth_household_id
		, :grouping
		, :id
		, :income
		, :name
		, :short_id
		, :target_amount
		, :target_month
		, :target_year
	) ON CONFLICT DO NOTHING
	RETURNING *
)
SELECT *
FROM category
UNION
	SELECT *
	FROM budget_category
	WHERE auth_household_id = :auth_household_id
	AND name = :name
`, b))
}

func (b *BudgetCategory) getChange(_ context.Context) string {
	return string(b.Name)
}

func (b *BudgetCategory) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &b.AuthHouseholdID, &b.ID
}

func (*BudgetCategory) getType() modelType {
	return modelBudgetCategory
}

func (b *BudgetCategory) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		b.AuthHouseholdID = *authHouseholdID
	}
}

func (b *BudgetCategory) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, `
UPDATE budget_category
SET
	  grouping = :grouping
	, income = :income
	, name = :name
	, target_amount = :target_amount
	, target_month = :target_month
	, target_year = :target_year
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, b))
}

func (b *BudgetCategory) UnmarshalJSON(bt []byte) error {
	type tmpB BudgetCategory

	var bc tmpB

	if err := json.Unmarshal(bt, &bc); err != nil {
		return err
	}

	*b = BudgetCategory(bc)

	return b.Validate()
}

// Validate verifies a BudgetCategory is correct.
func (b BudgetCategory) Validate() errs.Err {
	if b.Income && (b.TargetAmount != 0 || b.TargetMonth != 0 || b.TargetYear != 0) {
		return ErrBudgetCategory
	}

	return nil
}

// BudgetCategories is multiple BudgetCategory.
type BudgetCategories []BudgetCategory

func (*BudgetCategories) getType() modelType {
	return modelBudgetCategory
}

// BudgetCategoriesInit adds default categories to database for an AuthHouseholdID.
func BudgetCategoriesInit(ctx context.Context, authHouseholdID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	data := []struct {
		Grouping types.StringLimit
		Income   bool
		Name     types.StringLimit
	}{
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingBills.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryMortgageRent.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingBills.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryUtilities.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingFood.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryGroceries.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingFood.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryRestaurants.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingHome.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryClothing.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingHome.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryHouseholdGoods.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingIncome.Translate(GetISO639Code(ctx))),
			Income:   true,
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategorySalary.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingSavings.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryEmergencyFund.Translate(GetISO639Code(ctx))),
		},
		{
			Grouping: types.StringLimit(yaml8n.ObjectBudgetCategoryGroupingSavings.Translate(GetISO639Code(ctx))),
			Name:     types.StringLimit(yaml8n.ObjectBudgetCategoryVacation.Translate(GetISO639Code(ctx))),
		},
	}

	for _, category := range data {
		m := BudgetCategory{
			AuthHouseholdID: authHouseholdID,
			Grouping:        category.Grouping,
			Income:          category.Income,
			Name:            category.Name,
		}

		if err := m.create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
