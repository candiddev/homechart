package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestCookMealTimeCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.CookMealTimes[0]
	good.Name = "TestCookMealTimeCreate"

	var c models.CookMealTimes

	r := request{
		data:         good,
		method:       "POST",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/cook/meal-times",
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, good.Name)

	c[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &c[0], models.DeleteOpts{})
}

func TestCookMealTimeDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.CookMealTimes[0]
	d.Name = "TestCookMealTimeDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/cook/meal-times/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestCookMealTimeRead(t *testing.T) {
	logger.UseTestLogger(t)

	var c models.CookMealTimes

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/cook/meal-times/" + seed.CookMealTimes[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, seed.CookMealTimes[0].Name)
}

func TestCookMealTimeUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	cr := seed.CookMealTimes[0]
	cr.Name = "TestCookMealTimeUpdate"
	models.Create(ctx, &cr, models.CreateOpts{})

	newName := cr
	newName.Name = "TestCookMealTimeUpdate1"

	r := request{
		data:    newName,
		method:  "PUT",
		session: seed.AuthSessions[0],
		uri:     "/cook/meal-times/" + cr.ID.String(),
	}

	noError(t, r.do())

	models.Read(ctx, &cr, models.ReadOpts{})

	assert.Equal(t, newName.Name, cr.Name)

	models.Delete(ctx, &cr, models.DeleteOpts{})
}

func TestCookMealTimesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var c models.CookMealTimes

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/cook/meal-times",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(c), 0)
	assert.Equal(t, len(msg.DataIDs), 6)
}
