package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestNotesPageCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.NotesPages[0]
	good.Name = "TestCreate"
	good.ID = uuid.Nil

	var w models.NotesPages

	r := request{
		data:         good,
		method:       "POST",
		responseType: &w,
		session:      seed.AuthSessions[0],
		uri:          "/notes/pages",
	}

	noError(t, r.do())
	assert.Equal(t, w[0].Name, good.Name)
	assert.Equal(t, w[0].AuthHouseholdID, nil)

	models.Delete(ctx, &w[0], models.DeleteOpts{})
}

func TestNotesPageDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.NotesPages[0]
	d.ID = uuid.Nil
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/notes/pages/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestNotesPageRead(t *testing.T) {
	logger.UseTestLogger(t)

	var w models.NotesPages

	r := request{
		method:       "GET",
		responseType: &w,
		session:      seed.AuthSessions[0],
		uri:          "/notes/pages/" + seed.NotesPages[2].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, w[0].Name, seed.NotesPages[2].Name)
}

func TestNotesPageUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	w := seed.NotesPages[0]
	w.ID = uuid.Nil
	w.Name = "TestUpdate"
	models.Create(ctx, &w, models.CreateOpts{})

	newName := w
	newName.Name = "TestUpdate1"

	var wnew models.NotesPages

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &wnew,
		session:      seed.AuthSessions[0],
		uri:          "/notes/pages/" + newName.ID.String(),
	}.do())

	wnew[0].Updated = newName.Updated

	assert.Equal(t, wnew[0], newName)

	models.Delete(ctx, &w, models.DeleteOpts{})
}

func TestNotesPagesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var w models.NotesPages

	r := request{
		method:       "GET",
		responseType: &w,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/notes/pages",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(w), 0)
	assert.Equal(t, len(msg.DataIDs), 5)
}
