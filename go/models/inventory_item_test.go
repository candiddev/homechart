package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestInventoryItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	input := InventoryItem{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Image:           "notanimage",
		Name:            "test",
		Quantity:        2,
		Properties: InventoryItemProperties{
			"test": "yes",
		},
		UPC: "123456",
	}

	output := input

	assert.Equal(t, output.create(ctx, CreateOpts{}), nil)

	input.ID = output.ID
	input.Created = output.Created
	input.LastPurchased = output.LastPurchased
	input.ShortID = output.ShortID
	input.Updated = output.Updated

	assert.Equal(t, output, input)

	// Existing short ID
	id := types.NewNanoid()
	i := seed.InventoryItems[0]
	i.ID = uuid.Nil
	i.Name = "create"
	i.ShortID = id

	assert.Equal(t, i.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, i.ShortID, id)

	Delete(ctx, &i, DeleteOpts{})
}

func TestInventoryItemUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	input := InventoryItem{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Name:            "test",
		Quantity:        2,
		Properties: InventoryItemProperties{
			"test": "yes",
		},
		UPC: "123456",
	}

	input.create(ctx, CreateOpts{})

	input.Image = "notanimage"
	input.Name = "test2"
	input.Quantity = 1
	input.Properties = InventoryItemProperties{
		"atest": "absolutely",
	}
	input.UPC = "1222"

	output := input

	assert.Equal(t, output.update(ctx, UpdateOpts{}), nil)

	input.ID = output.ID
	input.LastPurchased = output.LastPurchased
	input.Updated = output.Updated

	assert.Equal(t, output, input)
}

func TestInventoryItemsReadAssistant(t *testing.T) {
	logger.UseTestLogger(t)

	assert.Contains(t, InventoryItemsReadAssistant(ctx, PermissionsOpts{
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Permissions:     Permissions{},
			},
		},
	}, "Flour"), "I found quantity 2 of Flour in your inventory.")
}
