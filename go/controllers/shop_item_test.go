package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestShopItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.ShopItems[0]
	good.ID = uuid.Nil
	good.Name = "TestCreate"

	var s models.ShopItems

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/items",
	}.do())

	assert.Equal(t, s[0].Name, good.Name)
	assert.Equal(t, s[0].AuthAccountID, nil)

	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestShopItemDelete(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopItems[0]
	s.ID = uuid.Nil
	s.Name = "TestDelete"
	models.Create(ctx, &s, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/shop/items/" + s.ID.String(),
	}.do())
}

func TestShopItemRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopItems

	noError(t, request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/items/" + seed.ShopItems[2].ID.String(),
	}.do())
	assert.Equal(t, s[0].Name, seed.ShopItems[2].Name)
}

func TestShopItemsUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopItems[0]
	s.ID = uuid.Nil
	s.Name = "TestUpdate"
	models.Create(ctx, &s, models.CreateOpts{})

	newName := s
	newName.Name = "TestUpdate1"

	var snew models.ShopItems

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &snew,
		session:      seed.AuthSessions[0],
		uri:          "/shop/items/" + s.ID.String(),
	}.do())

	snew[0].Updated = newName.Updated

	assert.Equal(t, snew[0], newName)

	models.Delete(ctx, &s, models.DeleteOpts{})
}

func TestShopItemsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopItems

	msg := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/shop/items",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 8)
}
