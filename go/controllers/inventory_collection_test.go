package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestInventoryCollectionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.InventoryCollections[0]
	good.ID = uuid.Nil
	good.Name = "TestInventoryCollectionCreate"

	var s models.InventoryCollections

	r := request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/collections",
	}

	noError(t, r.do())
	assert.Equal(t, s[0].Name, good.Name)

	s[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestInventoryCollectionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.InventoryCollections[0]
	d.ID = uuid.Nil
	d.Name = "TestInventoryCollectionDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/inventory/collections/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestInventoryCollectionRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.InventoryCollections

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/collections/" + seed.InventoryCollections[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, s[0].Name, seed.InventoryCollections[0].Name)
}

func TestInventoryCollectionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	si := seed.InventoryCollections[0]
	si.ID = uuid.Nil
	si.Name = "TestInventoryCollectionUpdate"
	models.Create(ctx, &si, models.CreateOpts{})

	newName := si
	newName.Name = "TestInventoryCollectionUpdate1"

	var s models.InventoryCollections

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/collections/" + si.ID.String(),
	}

	noError(t, r.do())

	s[0].AuthHouseholdID = newName.AuthHouseholdID
	s[0].Updated = newName.Updated

	assert.Equal(t, s[0], newName)

	models.Delete(ctx, &si, models.DeleteOpts{})
}

func TestInventoryCollectionsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.InventoryCollections

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/inventory/collections",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 6)
}
