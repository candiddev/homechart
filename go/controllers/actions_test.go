package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestReadAll(t *testing.T) {
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

	assert.Equal(t, len(msg.DataIDs), 6)
	assert.Equal(t, msg.DataTotal, 0)
	assert.Equal(t, msg.DataHash, models.GetCRC(msg.DataIDs))
}
