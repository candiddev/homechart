package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestShopListCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.ShopLists[0]
	good.ID = uuid.Nil
	good.Name = "TestCreate"

	var s models.ShopLists

	r := request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/lists",
	}

	noError(t, r.do())
	assert.Equal(t, s[0].Name, good.Name)
	assert.Equal(t, s[0].AuthHouseholdID, nil)

	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestShopListDelete(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopLists[0]
	s.ID = uuid.Nil
	s.Name = "TestDelete"
	models.Create(ctx, &s, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/shop/lists/" + s.ID.String(),
	}

	noError(t, r.do())
}

func TestShopListRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopLists

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/lists/" + seed.ShopLists[2].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, s[0].Name, seed.ShopLists[2].Name)
}

func TestShopListsUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.ShopLists[0]
	s.ID = uuid.Nil
	s.Name = "TestUpdate"
	models.Create(ctx, &s, models.CreateOpts{})

	newName := s
	newName.Name = "TestUpdate1"

	var snew models.ShopLists

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &snew,
		session:      seed.AuthSessions[0],
		uri:          "/shop/lists/" + newName.ID.String(),
	}

	noError(t, r.do())

	snew[0].Updated = newName.Updated

	assert.Equal(t, snew[0], newName)

	models.Delete(ctx, &s, models.DeleteOpts{})
}

func TestShopListsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopLists

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/shop/lists",
	}

	msg := r.do()

	noError(t, r.do())
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 5)
}
