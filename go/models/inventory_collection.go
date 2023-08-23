package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// InventoryCollection defines collections fields.
type InventoryCollection struct {
	AuthHouseholdID uuid.UUID                  `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	Grouping        types.StringLimit          `db:"grouping" json:"grouping"`
	ShortID         types.Nanoid               `db:"short_id" json:"shortID"`
	Icon            types.StringLimit          `db:"icon" json:"icon"`
	ID              uuid.UUID                  `db:"id" format:"uuid" json:"id"`
	Name            types.StringLimit          `db:"name" json:"name"`
	Sort            InventoryCollectionSort    `db:"sort" json:"sort"`
	Columns         InventoryCollectionColumns `db:"columns" json:"columns"`
	Created         time.Time                  `db:"created" format:"date-time" json:"created"`
	Updated         time.Time                  `db:"updated" format:"date-time" json:"updated"`
} // @Name InventoryCollection

// InventoryCollectionColumns is a map.
type InventoryCollectionColumns map[string]string // @Name InventoryCollectionColumns

// Scan reads in a InventoryCollectionColumns from a database.
func (i *InventoryCollectionColumns) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), i)

			return err
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

// Value converts an InventoryCollectionColumns to JSON.
func (i InventoryCollectionColumns) Value() (driver.Value, error) {
	j, err := json.Marshal(i)

	return j, err
}

// InventoryCollectionSort contains sort values used by UI.
type InventoryCollectionSort struct {
	Invert   bool   `json:"invert"`
	Property string `json:"property"`
} // @Name InventoryCollectionSort

// Scan reads in a InventoryCollectionSort from a database.
func (i *InventoryCollectionSort) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), i)

			return err
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

// Value converts an InventoryCollectionSort to JSON.
func (i InventoryCollectionSort) Value() (driver.Value, error) {
	j, err := json.Marshal(i)

	return j, err
}

func (i *InventoryCollection) SetID(id uuid.UUID) {
	i.ID = id
}

func (i *InventoryCollection) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	i.ID = GenerateUUID()

	if !opts.Restore || i.ShortID == "" {
		i.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, i, `
INSERT INTO inventory_collection (
	  auth_household_id
	, columns
	, grouping
	, icon
	, id
	, name
	, short_id
	, sort
) VALUES (
	  :auth_household_id
	, :columns
	, :grouping
	, :icon
	, :id
	, :name
	, :short_id
	, :sort
)
RETURNING *
`, i))
}

func (i *InventoryCollection) getChange(_ context.Context) string {
	return string(i.Name)
}

func (i *InventoryCollection) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &i.AuthHouseholdID, &i.ID
}

func (*InventoryCollection) getType() modelType {
	return modelInventoryCollection
}

func (i *InventoryCollection) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		i.AuthHouseholdID = *authHouseholdID
	}
}

func (i *InventoryCollection) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, i, `
UPDATE inventory_collection
SET
		auth_household_id = :auth_household_id
	, columns = :columns
	, grouping = :grouping
	, icon = :icon
	, id = :id
	, name = :name
	, sort = :sort
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, i))
}

// InventoryCollections is multiple InventoryCollection.
type InventoryCollections []InventoryCollection

func (*InventoryCollections) getType() modelType {
	return modelInventoryCollection
}

// InventoryCollectionsInit adds default collections to the database.
func InventoryCollectionsInit(ctx context.Context, authHouseholdID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	collections := InventoryCollections{
		{
			AuthHouseholdID: authHouseholdID,
			Columns: InventoryCollectionColumns{
				"image":               "",
				"name":                "",
				"properties.Location": "Attic",
			},
			Grouping: "Storage",
			Icon:     "inventory_2",
			Name:     "Attic",
			Sort: InventoryCollectionSort{
				Property: "name",
			},
		},
		{
			AuthHouseholdID: authHouseholdID,
			Columns: InventoryCollectionColumns{
				"image":               "",
				"name":                "",
				"properties.Location": "Basement",
			},
			Grouping: "Storage",
			Icon:     "inventory_2",
			Name:     "Basement",
			Sort: InventoryCollectionSort{
				Property: "name",
			},
		},
		{
			AuthHouseholdID: authHouseholdID,
			Columns: InventoryCollectionColumns{
				"image":               "",
				"name":                "",
				"properties.Location": "Pantry",
			},
			Grouping: "Storage",
			Icon:     "inventory_2",
			Name:     "Pantry",
			Sort: InventoryCollectionSort{
				Property: "name",
			},
		},
		{
			AuthHouseholdID: authHouseholdID,
			Columns: InventoryCollectionColumns{
				"image":    "",
				"name":     "",
				"quantity": "0",
			},
			Grouping: "Filters",
			Icon:     "warning",
			Name:     "Low Inventory",
			Sort: InventoryCollectionSort{
				Property: "name",
			},
		},
	}

	for i := range collections {
		if err := collections[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
