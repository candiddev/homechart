package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestNotesPageVersionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.NotesPageVersions[0]

	var w models.NotesPageVersions

	r := request{
		data:         good,
		method:       "POST",
		responseType: &w,
		session:      seed.AuthSessions[0],
		uri:          "/notes/page-versions",
	}

	noError(t, r.do())
	assert.Equal(t, w[0].Body, good.Body)

	w[0].AuthAccountID = &seed.AuthAccounts[0].ID
	w[0].AuthHouseholdID = &seed.AuthHouseholds[0].ID

	models.Delete(ctx, &w[0], models.DeleteOpts{})
}

func TestNotesPageVersionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.NotesPageVersions[0]
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/notes/page-versions/" + d.ID.String(),
	}.do())
}

func TestNotesPageVersionRead(t *testing.T) {
	logger.UseTestLogger(t)

	var w models.NotesPageVersions

	noError(t, request{
		method:       "GET",
		responseType: &w,
		session:      seed.AuthSessions[0],
		uri:          "/notes/page-versions/" + seed.NotesPageVersions[5].ID.String(),
	}.do())
	assert.Equal(t, w[0].Body, seed.NotesPageVersions[5].Body)
}

func TestNotesPageVersionsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var w models.NotesPageVersions

	msg := request{
		method:       "GET",
		responseType: &w,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/notes/page-versions",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(w), 0)
	assert.Equal(t, len(msg.DataIDs), 7)
}
