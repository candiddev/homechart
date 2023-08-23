package controllers

import (
	"context"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

type action int

const (
	actionCreate action = iota
	actionDelete
	actionRead
	actionUpdate
)

func (a action) do(ctx context.Context, m models.Model, w http.ResponseWriter, r *http.Request) errs.Err {
	ctx = logger.Trace(ctx)

	if a != actionRead && a != actionDelete {
		if err := getJSON(ctx, m, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return err
		}
	}

	if a != actionCreate {
		id := getUUID(r, "id")
		if id == uuid.Nil {
			err := errs.ErrClientBadRequestProperty
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return err
		}

		m.SetID(id)
	}

	var err errs.Err

	p := getPermissions(ctx)

	switch a {
	case actionCreate:
		err = models.Create(ctx, m, models.CreateOpts{
			PermissionsOpts: p,
		})
	case actionDelete:
		err = models.Delete(ctx, m, models.DeleteOpts{
			PermissionsOpts: p,
		})
	case actionRead:
		err = models.Read(ctx, m, models.ReadOpts{
			PermissionsOpts: p,
		})
	case actionUpdate:
		err = models.Update(ctx, m, models.UpdateOpts{
			PermissionsOpts: p,
		})
	}

	return WriteResponse(ctx, w, m, nil, 1, "", logger.Log(ctx, err))
}

func readAll(ctx context.Context, m models.Models, w http.ResponseWriter) errs.Err {
	hash, ids, err := models.ReadAll(ctx, m, models.ReadAllOpts{
		Hash:            getHash(ctx),
		PermissionsOpts: getPermissions(ctx),
		Updated:         getUpdated(ctx),
	})

	return WriteResponse(ctx, w, m, ids, 0, hash, err)
}
