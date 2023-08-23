package controllers

import (
	"errors"
	"net/http"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// AuthResetCreate resets an AuthAccount using an email.
func (h *Handler) AuthResetCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	m := models.Notification{
		BodySMTP:    yaml8n.EmailPasswordResetBodyHeader.Translate(a.ISO639Code),
		SubjectSMTP: yaml8n.EmailPasswordResetSubject.Translate(a.ISO639Code),
		ToSMTP:      a.EmailAddress.String(),
	}

	// Read AuthAccount
	err := a.ReadPasswordReset(ctx)
	if err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		m.BodySMTP += "\n\n" + yaml8n.EmailPasswordResetBodyMissing.Translate(a.ISO639Code)
	} else {
		// Create token
		e := models.GenerateTimestamp().Add(1 * time.Hour)
		a.PasswordResetExpires = e
		rt := models.GenerateUUID()
		a.PasswordResetToken = types.UUIDToNullUUID(rt)

		err = a.UpdatePasswordReset(ctx)
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		// Update message
		m.BodySMTP += "\n\n" + templates.EmailPasswordResetBodySuccess(a.ISO639Code, h.Config.App.BaseURL, string(a.EmailAddress), a.PasswordResetToken.UUID.String())
	}

	go m.Send(ctx, nil) //nolint:errcheck

	logger.LogNotice(noticeAuthAccountReset, a.EmailAddress.String())
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))
}

// AuthResetUpdate resets an AuthAccount password using a token.
func (*Handler) AuthResetUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Read AuthAccount
	old := a

	err := old.ReadPasswordReset(ctx)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Check token
	if ((a.PasswordResetToken == nil && old.PasswordResetToken != nil) || (a.PasswordResetToken != nil && old.PasswordResetToken == nil) || (*a.PasswordResetToken != *old.PasswordResetToken)) || (old.PasswordResetExpires != time.Time{} && old.PasswordResetExpires.Before(models.GenerateTimestamp())) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientNoContent))

		return
	}

	// Change password
	a.ID = old.ID

	if err = a.UpdatePasswordHash(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	a.TOTPSecret = ""

	if err = a.UpdateTOTP(ctx); err != nil && !errors.Is(err, errs.ErrClientBadRequestMissing) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Remove token and verify account
	a.PasswordResetToken = nil
	a.Verified = true

	err = a.UpdatePasswordReset(ctx)

	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Send email
	m := models.Notification{
		BodySMTP:    yaml8n.EmailEmailAddressChangeConfirmationBody.Translate(a.ISO639Code),
		SubjectSMTP: yaml8n.EmailEmailAddressChangeConfirmationSubject.Translate(a.ISO639Code),
		ToSMTP:      old.EmailAddress.String(),
	}
	if sendErr := m.Send(ctx, nil); sendErr != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, sendErr))

		return
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))
}
