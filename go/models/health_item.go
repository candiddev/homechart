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

// HealthItem defines item fields.
type HealthItem struct {
	AuthAccountID     uuid.UUID              `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	ID                uuid.UUID              `db:"id" format:"uuid" json:"id"`
	Correlations      HealthItemCorrelations `db:"correlations" json:"correlations"`
	Color             types.Color            `db:"color" json:"color"`
	TotalCorrelations int                    `db:"total_correlations" json:"totalCorrelations"`
	Output            bool                   `db:"output" json:"output"`
	Name              types.StringLimit      `db:"name" json:"name"`
	Created           time.Time              `db:"created" json:"created"`
	Updated           time.Time              `db:"updated" json:"updated"`
} // @Name HealthItem

func (h *HealthItem) SetID(id uuid.UUID) {
	h.ID = id
}

func (h *HealthItem) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	h.ID = GenerateUUID()

	return logger.Error(ctx, db.Query(ctx, false, h, `
INSERT INTO health_item (
	  auth_account_id
	, color
	, id
	, name
	, output
) VALUES (
	  :auth_account_id
	, :color
	, :id
	, :name
	, :output
)
ON CONFLICT (auth_account_id, name) DO UPDATE SET updated = now()
RETURNING *
`, h))
}

func (h *HealthItem) getChange(ctx context.Context) string {
	aa := AuthAccount{
		ID: h.AuthAccountID,
	}

	if err := aa.Read(ctx); err != nil || !aa.Child {
		return ""
	}

	return string(h.Name)
}

func (h *HealthItem) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return &h.AuthAccountID, nil, &h.ID
}

func (*HealthItem) getType() modelType {
	return modelHealthItem
}

func (*HealthItem) setIDs(_, _ *uuid.UUID) {} // Can't set IDs for HealthLogs as they may be for a child.

func (h *HealthItem) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE health_item
SET
	  color = :color
	, name = :name
	, output = :output
FROM auth_account
WHERE health_item.id = :id
AND health_item.auth_account_id = auth_account.id
AND (
	health_item.auth_account_id = '%s'
	OR (
		auth_account.primary_auth_household_id = ANY('%s')
		AND auth_account.child
	)
)
RETURNING health_item.*
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs().String())

	return logger.Error(ctx, db.Query(ctx, false, h, query, h))
}

// HealthItems is multiple HealthItem.
type HealthItems []HealthItem

func (*HealthItems) getType() modelType {
	return modelHealthItem
}

// HealthItemsInit adds default health items to a database for an AuthAccount.
func HealthItemsInit(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	h := HealthItems{
		{
			Color:  types.ColorBlue,
			Name:   "Anxiety",
			Output: true,
		},
		{
			Color:  types.ColorBrown,
			Name:   "Bloating/Cramping/Gas",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Brain Fog",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Depression",
			Output: true,
		},
		{
			Color:  types.ColorBrown,
			Name:   "Diarrhea",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Fatigue",
			Output: true,
		},
		{
			Color:  types.ColorRed,
			Name:   "Headache",
			Output: true,
		},
		{
			Color:  types.ColorBrown,
			Name:   "Heartburn",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Hyperactivity",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Insomnia",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Irritability",
			Output: true,
		},
		{
			Color:  types.ColorYellow,
			Name:   "Itching",
			Output: true,
		},
		{
			Color:  types.ColorRed,
			Name:   "Joint Pain",
			Output: true,
		},
		{
			Color:  types.ColorRed,
			Name:   "Migraine",
			Output: true,
		},
		{
			Color:  types.ColorRed,
			Name:   "Muscle Pain",
			Output: true,
		},
		{
			Color:  types.ColorBrown,
			Name:   "Nausea",
			Output: true,
		},
		{
			Color:  types.ColorGreen,
			Name:   "Runny Nose",
			Output: true,
		},
		{
			Color:  types.ColorBlue,
			Name:   "Vision Problems",
			Output: true,
		},
		{
			Color: types.ColorBrown,
			Name:  "Beans",
		},
		{
			Color: types.ColorBrown,
			Name:  "Caffeine",
		},
		{
			Color: types.ColorGreen,
			Name:  "Celery",
		},
		{
			Color: types.ColorYellow,
			Name:  "Corn",
		},
		{
			Color: types.ColorWhite,
			Name:  "Dairy",
		},
		{
			Color: types.ColorWhite,
			Name:  "Eggs",
		},
		{
			Color: types.ColorRed,
			Name:  "Fish",
		},
		{
			Color: types.ColorGreen,
			Name:  "Fruit",
		},
		{
			Color: types.ColorBrown,
			Name:  "Gluten",
		},
		{
			Color: types.ColorYellow,
			Name:  "Mustard",
		},
		{
			Color: types.ColorBrown,
			Name:  "Peanuts",
		},
		{
			Color: types.ColorRed,
			Name:  "Poultry",
		},
		{
			Color: types.ColorRed,
			Name:  "Red Meat",
		},
		{
			Color: types.ColorBrown,
			Name:  "Sesame",
		},
		{
			Color: types.ColorRed,
			Name:  "Shellfish",
		},
		{
			Color: types.ColorGreen,
			Name:  "Soy",
		},
		{
			Color: types.ColorWhite,
			Name:  "Sugar Alcohols",
		},
		{
			Color: types.ColorWhite,
			Name:  "Sulphites",
		},
		{
			Color: types.ColorBrown,
			Name:  "Tree Nuts",
		},
		{
			Color: types.ColorYellow,
			Name:  "Wheat",
		},
	}

	for i := range h {
		h[i].AuthAccountID = authAccountID

		if err := h[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}
