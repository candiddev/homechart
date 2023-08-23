package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// ShopCategory defines category fields.
type ShopCategory struct {
	BudgetPayeeID   *uuid.UUID        `db:"budget_payee_id" format:"uuid" json:"budgetPayeeID"`
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Match           string            `db:"match" json:"match"`
	Name            types.StringLimit `db:"name" json:"name"`
} // @Name ShopCategory

func (s *ShopCategory) SetID(id uuid.UUID) {
	s.ID = id
}

func (s *ShopCategory) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	s.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, s, `
INSERT INTO shop_category (
	  auth_household_id
	, budget_payee_id
	, id
	, match
	, name
) VALUES (
	  :auth_household_id
	, :budget_payee_id
	, :id
	, :match
	, :name
)
RETURNING *
`, s))
}

func (s *ShopCategory) getChange(_ context.Context) string {
	return string(s.Name)
}

func (s *ShopCategory) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &s.AuthHouseholdID, &s.ID
}

func (*ShopCategory) getType() modelType {
	return modelShopCategory
}

func (s *ShopCategory) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		s.AuthHouseholdID = *authHouseholdID
	}
}

func (s *ShopCategory) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, s, `
UPDATE shop_category
SET
	  budget_payee_id = :budget_payee_id
	, match = :match
	, name = :name
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, s))
}

// ShopCategories is multiple ShopCategory.
type ShopCategories []ShopCategory

func (*ShopCategories) getType() modelType {
	return modelShopCategory
}

// ShopCategoriesInit adds default categories to a database for an AuthHouseholdID.
func ShopCategoriesInit(ctx context.Context, authHouseholdID uuid.UUID, _ uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	data := []struct {
		Name  types.StringLimit
		Match string
	}{
		{
			Name:  "Bakery",
			Match: "bagel|baguette|bun|cake|bread|cookie|donut|doughnut|muffin|pie",
		},
		{
			Name:  "Beverages",
			Match: "beer|brandy|champagne|coffee|drink|gin|juice|mixer|rum|soda|spirit|tea|tequila|tonic|vodka|water|whiskey|wine",
		},
		{
			Name:  "Canned Goods",
			Match: "anchov|baked bean|black bean|can|chickpea|creamed corn|fava bean|kidney bean|red bean|pinto bean|soup|stew",
		},
		{
			Name:  "Cleaning",
			Match: "air freshener|bleach|cleaner|detergent|fabric softener|garbage|scrub|soap|sponge",
		},
		{
			Name:  "Condiments",
			Match: "honey|jam|jelly|ketchup|marmalade|mayonnaise|mustard|nacho|olives|peanut butter|pickles|relish|salad dressing|salsa|sauce|syrup",
		},
		{
			Name:  "Dairy",
			Match: "butter|cheese|cream cheese|egg|heavy cream|margarine|milk|yogurt",
		},
		{
			Name:  "Dry Goods",
			Match: "baking|bouillon|breadcrumbs|cereal|cocoa|cracker|cubes|flour|mac|maple|mix|molasses|noodle|oatmeal|oil|quinoa|rice|spaghetti|sugar|vinegar|yeast",
		},
		{
			Name:  "Frozen",
			Match: "burrito|corn dog|french fr|frozen|green bean|hash brown|ice cream|nuggets|pancake|pea|pie crust|pizza|popsicle|pot pie|tater tot|waffle",
		},
		{
			Name:  "Health and Beauty",
			Match: "band-aid|bottle|bug|conditioner|cotton|deodorant|diaper|floss|formula|hair|hand|lip|lotion|medic|ointment|prescription|razor|shampoo|shave|sun|tissue|vitamin|wash|wipe",
		},
		{
			Name:  "Home",
			Match: "aluminum foil|bag|batter|candle|container|cup|cutlery|napkin|plate|towel|wrap",
		},
		{
			Name:  "Meat",
			Match: "bacon|beef|bologna|chicken|clam|cod|crab|flounder|halibut|ham|hot dog|lobster|mussel|oyster|pepperoni|pork|salami|salmon|sausage|shrimp|snapper|steak|tilapia|tuna|turkey|wing",
		},
		{
			Name:  "Office",
			Match: "computer|ink|pen|pencil",
		},
		{
			Name:  "Pet Supplies",
			Match: "cat food|catnip|chew|collar|dog food|litter|treats",
		},
		{
			Name:  "Produce",
			Match: "apple|apricot|asparagus|avocado|banana|basil|beet|blueberr|broccoli|brussel|cabbage|cantaloupe|carrot|cauliflower|celery|chard|cherr|chive|cilantro|collard|corn|cranberr|cucumber|eggplant|endive|garlic|grape|green pepper|honeydew|kale|kiwi|kohlrabi|lettuce|lime|lemon|mango|melon|mushroom|nectarine|orange|onion|papaya|parsnip|peach|pear|pineapple|plum|potato|pumpkin|radish|raspberr|red pepper|rutabaga|spinach|sprout|squash|strawberr|tomato|yam|zucchini",
		},
		{
			Name:  "Spices",
			Match: "all spice|bay leaf|black pepper|chili powder|cinnamon|clove|ginger|ground|mint|oregano|paprika|parsley|powder|sage|salt|spice|thyme|vanilla",
		},
		{
			Name:  "Snacks",
			Match: "bar|candy|chip|popcorn|pretzel|stick",
		},
	}

	for _, category := range data {
		m := ShopCategory{
			AuthHouseholdID: authHouseholdID,
			Name:            category.Name,
			Match:           category.Match,
		}
		if err := m.create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
