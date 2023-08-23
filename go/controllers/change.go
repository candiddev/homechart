package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// ChangeRead reads a Change.
// @Accept json
// @ID ChangeRead
// @Param id path string true "ID"
// @Produce json
// @Router /changes/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Changes}
// @Summary Read Change
// @Tags Change
func (*Handler) ChangeRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	id := getUUID(r, "id")
	if id == uuid.Nil {
		err := errs.ErrClientBadRequestProperty
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	p := getPermissions(ctx)

	c := models.Change{
		ID: id,
	}

	err := models.Read(ctx, &c, models.ReadOpts{
		PermissionsOpts: p,
	})

	if err == nil && !c.IsPermitted(*p.AuthHouseholdsPermissions) {
		err = errs.ErrClientBadRequestMissing
	}

	WriteResponse(ctx, w, c, nil, 1, "", logger.Log(ctx, err))
}

// ChangesRead reads all Changes for an AuthHousehold.
// @Accept json
// @ID ChangesRead
// @Produce json
// @Router /changes [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.Changes}
// @Summary Read all Changes
// @Tags Change
func (*Handler) ChangesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	c := models.Changes{}
	p := getPermissions(ctx)

	hash, ids, err := models.ReadAll(ctx, &c, models.ReadAllOpts{
		Hash:            getHash(ctx),
		PermissionsOpts: p,
		Updated:         getUpdated(ctx),
	})

	c = c.Filter(*p.AuthHouseholdsPermissions)

	WriteResponse(ctx, w, c, ids, 0, hash, logger.Log(ctx, err))
}
