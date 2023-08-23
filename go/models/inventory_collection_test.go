package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestInventoryCollectionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	input := InventoryCollection{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Columns: InventoryCollectionColumns{
			"test": "yes",
		},
		Grouping: "test",
		Icon:     "test",
		Name:     "test",
		Sort: InventoryCollectionSort{
			Invert:   true,
			Property: "somethingelse",
		},
	}

	output := input

	assert.Equal(t, output.create(ctx, CreateOpts{}), nil)

	input.Created = output.Created
	input.ID = output.ID
	input.ShortID = output.ShortID
	input.Updated = output.Updated

	assert.Equal(t, output, input)

	Delete(ctx, &input, DeleteOpts{})

	// Existing short ID
	id := types.NewNanoid()
	i := seed.InventoryCollections[0]
	i.ID = uuid.Nil
	i.Name = "create"
	i.ShortID = id

	assert.Equal(t, i.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, i.ShortID, id)

	Delete(ctx, &i, DeleteOpts{})
}

func TestInventoryCollectionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	input := InventoryCollection{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Columns: InventoryCollectionColumns{
			"test": "yes",
		},
		Grouping: "test1",
		Name:     "test",
	}

	input.create(ctx, CreateOpts{})

	input.Grouping = "test"
	input.Icon = "test2"
	input.Name = "test2"
	input.Columns = InventoryCollectionColumns{
		"atest": "absolutely",
	}
	input.Sort = InventoryCollectionSort{
		Invert:   true,
		Property: "somethingelse",
	}

	output := input

	assert.Equal(t, output.update(ctx, UpdateOpts{}), nil)

	input.ID = output.ID
	input.Updated = output.Updated

	assert.Equal(t, output, input)
}

func TestInventoryCollectionsInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	assert.Equal(t, InventoryCollectionsInit(ctx, ah.ID), nil)

	var collections InventoryCollections

	ReadAll(ctx, &collections, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(collections), 4)

	ah.Delete(ctx)
}
