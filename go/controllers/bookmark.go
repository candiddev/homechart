package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// BookmarkCreate creates a new Bookmark using POST data.
// @Accept json
// @ID BookmarkCreate
// @Param body body models.Bookmark true "Bookmark"
// @Produce json
// @Router /bookmarks [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Bookmarks}
// @Summary Create Bookmark
// @Tags Bookmark
func (*Handler) BookmarkCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	err := actionCreate.do(ctx, &models.Bookmark{}, w, r)
	logger.Log(ctx, err) //nolint:errcheck
}

// BookmarkDelete deletes a Bookmark.
// @Accept json
// @ID BookmarkDelete
// @Param id path string true "ID"
// @Produce json
// @Router /bookmarks/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete Bookmark
// @Tags Bookmark
func (*Handler) BookmarkDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	err := actionDelete.do(ctx, &models.Bookmark{}, w, r)
	logger.Log(ctx, err) //nolint:errcheck
}

// BookmarkRead reads a Bookmark.
// @Accept json
// @ID BookmarkRead
// @Param id path string true "ID"
// @Produce json
// @Router /bookmarks/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Bookmarks}
// @Summary Read Bookmark
// @Tags Bookmark
func (*Handler) BookmarkRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	err := actionRead.do(ctx, &models.Bookmark{}, w, r)
	logger.Log(ctx, err) //nolint:errcheck
}

// BookmarkUpdate updates a Bookmark.
// @Accept json
// @ID BookmarkUpdate
// @Param body body models.Bookmark true "Bookmark"
// @Param id path string true "ID"
// @Produce json
// @Router /bookmarks/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Bookmarks}
// @Summary Update Bookmark
// @Tags Bookmark
func (*Handler) BookmarkUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	err := actionUpdate.do(ctx, &models.Bookmark{}, w, r)
	logger.Log(ctx, err) //nolint:errcheck
}

// BookmarksRead reads all Bookmarks for an AuthHousehold.
// @Accept json
// @ID BookmarksRead
// @Produce json
// @Router /bookmarks [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Bookmarks}
// @Summary Read all Bookmarks
// @Tags Bookmark
func (*Handler) BookmarksRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	err := readAll(ctx, &models.Bookmarks{}, w)
	logger.Log(ctx, err) //nolint:errcheck
}
