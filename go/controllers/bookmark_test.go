package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestBookmarkCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.Bookmarks[0]
	good.Name = "TestCreate"
	good.ID = uuid.Nil

	var b models.Bookmarks

	r := request{
		data:         good,
		method:       "POST",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/bookmarks",
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, good.Name)
	assert.Equal(t, b[0].AuthHouseholdID, nil)

	models.Delete(ctx, &b[0], models.DeleteOpts{})
}

func TestBookmarkDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.Bookmarks[0]
	d.ID = uuid.Nil
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/bookmarks/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBookmarkRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.Bookmarks

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/bookmarks/" + seed.Bookmarks[1].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Name, seed.Bookmarks[1].Name)
}

func TestBookmarkUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.Bookmarks[0]
	b.ID = uuid.Nil
	b.Name = "TestUpdate"
	models.Create(ctx, &b, models.CreateOpts{})

	newName := b
	newName.Name = "TestUpdate1"

	var bnew models.Bookmarks

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &bnew,
		session:      seed.AuthSessions[0],
		uri:          "/bookmarks/" + b.ID.String(),
	}

	noError(t, r.do())

	bnew[0].Updated = newName.Updated

	assert.Equal(t, bnew[0], newName)

	models.Delete(ctx, &b, models.DeleteOpts{})
}

func TestBookmarksRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.Bookmarks

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/bookmarks",
	}

	msg := r.do()

	noError(t, r.do())
	assert.Equal(t, len(b), 0)
	assert.Equal(t, len(msg.DataIDs), 8)
}
