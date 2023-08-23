package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// InventoryItem defines item fields.
type InventoryItem struct {
	AuthHouseholdID uuid.UUID               `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	ID              uuid.UUID               `db:"id" format:"uuid" json:"id"`
	Image           types.Image             `db:"image" json:"image"`
	Name            types.StringLimit       `db:"name" json:"name"`
	UPC             types.StringLimit       `db:"upc" json:"upc"`
	Quantity        int                     `db:"quantity" json:"quantity"`
	ShortID         types.Nanoid            `db:"short_id" json:"shortID"`
	LastPurchased   types.CivilDate         `db:"last_purchased" json:"lastPurchased" swaggertype:"string"`
	Properties      InventoryItemProperties `db:"properties" json:"properties"`
	Created         time.Time               `db:"created" format:"date-time" json:"created"`
	Updated         time.Time               `db:"updated" format:"date-time" json:"updated"`
} // @Name InventoryItem

// InventoryItemProperties is a map.
type InventoryItemProperties map[string]string // @Name InventoryItemProperties

// Scan reads in a InventoryItemProperties from a database.
func (i *InventoryItemProperties) Scan(src any) error {
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

// Value converts an InventoryItemProperties to JSON.
func (i InventoryItemProperties) Value() (driver.Value, error) {
	j, err := json.Marshal(i)

	return j, err
}

func (i *InventoryItem) SetID(id uuid.UUID) {
	i.ID = id
}

func (i *InventoryItem) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	i.ID = GenerateUUID()

	if !opts.Restore || i.ShortID == "" {
		i.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, i, `
INSERT INTO inventory_item (
	  auth_household_id
	, id
	, image
	, name
	, quantity
	, properties
	, short_id
	, upc
) VALUES (
	  :auth_household_id
	, :id
	, :image
	, :name
	, :quantity
	, :properties
	, :short_id
	, :upc
)
RETURNING *
`, i))
}

func (i *InventoryItem) getChange(_ context.Context) string {
	return string(i.Name)
}

func (i *InventoryItem) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &i.AuthHouseholdID, &i.ID
}

func (*InventoryItem) getType() modelType {
	return modelInventoryItem
}

func (i *InventoryItem) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		i.AuthHouseholdID = *authHouseholdID
	}
}

func (i *InventoryItem) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, i, `
UPDATE inventory_item
SET
		auth_household_id = :auth_household_id
	, id = :id
	, image = :image
	, name = :name
	, quantity = :quantity
	, properties = :properties
	, upc = :upc
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, i))
}

// InventoryItems is multiple InventoryItem.
type InventoryItems []InventoryItem

func (*InventoryItems) getType() modelType {
	return modelInventoryItem
}

// InventoryItemsReadAssistant reads all items for an assistant and returns a text prompt.
func InventoryItemsReadAssistant(ctx context.Context, p PermissionsOpts, name string) string {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &InventoryItem{}, p)
	if err != nil {
		return speechForbidden
	}

	filter := map[string]any{
		"auth_household_ids": f.AuthHouseholdIDs,
		"item":               "%" + name + "%",
	}

	var item InventoryItem

	err = db.Query(ctx, false, &item, `
SELECT
	name,
	quantity
FROM inventory_item
WHERE
	auth_household_id = ANY(:auth_household_ids)
	AND lower(name) LIKE lower(:item)
`, filter)
	if err != nil {
		return fmt.Sprintf("I couldn't find any %s in your inventory.", name)
	}

	return fmt.Sprintf("%sI found quantity %d of %s in your inventory.", getAcknowledgement(), item.Quantity, item.Name)
}
