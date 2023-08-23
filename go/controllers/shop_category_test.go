package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestShopCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.ShopCategories[0]
	good.Name = "TestShopCategoryCreate"

	var s models.ShopCategories

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/categories",
	}.do())

	assert.Equal(t, s[0].Name, good.Name)

	s[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestShopCategoryDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.ShopCategories[0]
	d.Name = "TestShopCategoryDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/shop/categories/" + d.ID.String(),
	}.do())
}

func TestShopCategoryRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopCategories

	noError(t, request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/categories/" + seed.ShopCategories[0].ID.String(),
	}.do())
	assert.Equal(t, s[0].Name, seed.ShopCategories[0].Name)
}

func TestShopCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	si := seed.ShopCategories[0]
	si.Name = "TestShopCategoryUpdate"
	models.Create(ctx, &si, models.CreateOpts{})

	newName := si
	newName.Name = "TestShopCategoryUpdate1"

	var s models.ShopCategories

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/shop/categories/" + si.ID.String(),
	}.do())

	s[0].AuthHouseholdID = newName.AuthHouseholdID
	s[0].Updated = newName.Updated

	assert.Equal(t, s[0], newName)

	models.Delete(ctx, &si, models.DeleteOpts{})
}

func TestShopCategoriesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.ShopCategories

	msg := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/shop/categories",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 20)
}
