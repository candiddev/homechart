package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestInventoryItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.InventoryItems[0]
	good.ID = uuid.Nil
	good.Name = "TestInventoryItemCreate"

	var s models.InventoryItems

	r := request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/items",
	}

	noError(t, r.do())

	assert.Equal(t, s[0].Name, good.Name)

	s[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestInventoryItemDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.InventoryItems[0]
	d.ID = uuid.Nil
	d.Name = "TestInventoryItemDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/inventory/items/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestInventoryItemRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.InventoryItems

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/items/" + seed.InventoryItems[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, s[0].Name, seed.InventoryItems[0].Name)
}

func TestInventoryItemUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	si := seed.InventoryItems[0]
	si.ID = uuid.Nil
	si.Name = "TestInventoryItemUpdate"
	models.Create(ctx, &si, models.CreateOpts{})

	newName := si
	newName.Name = "TestInventoryItemUpdate1"

	var s models.InventoryItems

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/inventory/items/" + si.ID.String(),
	}

	noError(t, r.do())

	s[0].AuthHouseholdID = newName.AuthHouseholdID
	s[0].Image = newName.Image
	s[0].Updated = newName.Updated

	assert.Equal(t, s[0], newName)

	models.Delete(ctx, &si, models.DeleteOpts{})
}

func TestInventoryItemsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.InventoryItems

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/inventory/items",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 4)
}
