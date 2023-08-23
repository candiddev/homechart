package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestHealthLogCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.HealthLogs[0]

	var i models.HealthLogs

	r := request{
		data:         good,
		method:       "POST",
		responseType: &i,
		session:      seed.AuthSessions[0],
		uri:          "/health/logs",
	}

	noError(t, r.do())
	assert.Equal(t, i[0].HealthItemID, good.HealthItemID)

	models.Delete(ctx, &i[0], models.DeleteOpts{})
}

func TestHealthLogDelete(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthLogs[0]
	models.Create(ctx, &i, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/health/logs/" + i.ID.String(),
	}

	noError(t, r.do())
}

func TestHealthLogRead(t *testing.T) {
	logger.UseTestLogger(t)

	var i models.HealthLogs

	r := request{
		method:       "GET",
		responseType: &i,
		session:      seed.AuthSessions[0],
		uri:          "/health/logs/" + seed.HealthLogs[2].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, i[0].HealthItemID, seed.HealthLogs[2].HealthItemID)
}

func TestHealthLogUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthLogs[0]
	models.Create(ctx, &i, models.CreateOpts{})

	newID := i
	newID.HealthItemID = seed.HealthItems[1].ID

	var inew models.HealthLogs

	r := request{
		data:         newID,
		method:       "PUT",
		responseType: &inew,
		session:      seed.AuthSessions[0],
		uri:          "/health/logs/" + newID.ID.String(),
	}
	msg := r.do()

	noError(t, msg)

	inew[0].Updated = newID.Updated

	assert.Equal(t, inew[0], newID)

	models.Delete(ctx, &i, models.DeleteOpts{})
}

func TestHealthLogsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var i models.HealthLogs

	r := request{
		method:       "GET",
		responseType: &i,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/health/logs",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(i), 0)
	assert.Equal(t, len(msg.DataIDs), 6)
}
