package controllers

import (
	"net/http"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// NotificationCreate creates a new admin mail using POST data.
func (*Handler) NotificationCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Notification from body
	var n models.Notification

	if err := getJSON(ctx, &n, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if time.Now().After(n.SendAfter) {
		go n.Send(ctx, nil) //nolint:errcheck

		WriteResponse(ctx, w, n, nil, 1, "", logger.Error(ctx, nil))

		return
	}

	// Create notification
	err := models.Create(ctx, &n, models.CreateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: getAuthSessionAdmin(ctx),
		},
	})

	WriteResponse(ctx, w, n, nil, 1, "", logger.Error(ctx, err))
}

// NotificationDelete deletes email from database.
func (*Handler) NotificationDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Notification from param
	var n models.Notification

	n.ID = getUUID(r, "id")
	if n.ID == uuid.Nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	// Delete notification
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, n.Delete(ctx)))
}

// NotificationUpdate updates an email message in database.
func (*Handler) NotificationUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Notification from body
	var n models.Notification

	if err := getJSON(ctx, &n, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Get ID from param
	n.ID = getUUID(r, "id")
	if n.ID == uuid.Nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	// Update notification
	err := models.Update(ctx, &n, models.UpdateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: getAuthSessionAdmin(ctx),
		},
	})

	WriteResponse(ctx, w, n, nil, 1, "", logger.Error(ctx, err))
}

// NotificationsRead reads all Notifications in the database.
func (*Handler) NotificationsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Read notifications
	n, err := models.NotificationsRead(ctx)

	WriteResponse(ctx, w, n, nil, 0, "", logger.Error(ctx, err))
}
