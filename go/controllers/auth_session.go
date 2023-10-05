package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

func (h *Handler) createAuthSession(ctx context.Context, r *http.Request, a *models.AuthAccount) (models.AuthSession, errs.Err) {
	// Create the session
	s := models.AuthSession{
		AuthAccountID:         a.ID,
		PermissionsAccount:    a.PermissionsAccount,
		PermissionsHouseholds: a.PermissionsHouseholds,
		UserAgent:             a.UserAgent,
	}
	ctx = models.SetAuthAccountID(ctx, s.AuthAccountID)

	if a.RememberMe {
		expires := models.GenerateTimestamp().Add(time.Duration(h.Config.App.SessionExpirationRememberSeconds) * time.Second)
		s.Expires = expires
	} else {
		expires := models.GenerateTimestamp().Add(time.Duration(h.Config.App.SessionExpirationDefaultSeconds) * time.Second)
		s.Expires = expires
	}

	s.Name = cases.Title(language.English).String(string(types.ParseUserAgent(r.UserAgent())))

	// Check if admin
	for _, emailAddress := range h.Config.App.AdminEmailAddresses {
		if a.EmailAddress.String() == emailAddress {
			s.Admin = true
		}
	}

	if err := s.Create(ctx, false); err != nil {
		return s, err
	}

	err := s.Read(ctx, false)

	return s, err
}

// AuthSessionCreate creates a new AuthSession using POST data.
// @Accept json
// @ID AuthSessionCreate
// @Param body body models.AuthSession true "AuthSession"
// @Produce json
// @Router /auth/sessions [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Create AuthSession
// @Tags AuthSession
func (*Handler) AuthSessionCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthSession from body
	var a models.AuthSession

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	p := getPermissions(ctx)
	// Child accounts can't create new sessions
	if getChild(ctx) || (p.AuthAccountPermissions != nil && !p.AuthAccountPermissions.IsPermitted(models.PermissionComponentAuth, models.PermissionEdit, true)) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Copy contexts
	a.Admin = false

	// Check if trying to create session for child account
	if models.GetAuthAccountID(ctx) != a.AuthAccountID {
		// Get account for new session
		c := models.AuthAccount{
			ID: a.AuthAccountID,
		}

		if err := c.Read(ctx); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		// Check if child and part of household
		if !c.Child || (c.PrimaryAuthHouseholdID != nil && p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&c.PrimaryAuthHouseholdID.UUID, models.PermissionComponentAuth, models.PermissionEdit)) {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

			return
		}
	} else {
		a.AuthAccountID = models.GetAuthAccountID(ctx)
	}

	if a.Expires.IsZero() {
		a.Expires = time.Now().Add(5 * 365 * 24 * time.Hour)
	}

	// Create session
	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, a.Create(ctx, false)))
}

// AuthSessionDelete deletes an AuthSession using URL parameters.
// @Accept json
// @ID AuthSessionDelete
// @Param id path string true "ID"
// @Produce json
// @Router /auth/sessions/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete AuthSession
// @Tags AuthSession
func (*Handler) AuthSessionDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Session ID
	a := models.AuthSession{
		ID:            getUUID(r, "auth_session_id"),
		AuthAccountID: models.GetAuthAccountID(ctx),
	}

	// Delete session
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, a.Delete(ctx)))
}

// AuthSessionDeleteAll deletes an AuthSession using URL parameters.
// @Accept json
// @ID AuthSessionDeleteAll
// @Produce json
// @Router /auth/sessions [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete all AuthSessions
// @Tags AuthSession
func (*Handler) AuthSessionDeleteAll(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	a := models.AuthSession{
		AuthAccountID: models.GetAuthAccountID(ctx),
	}

	if getAuthSessionAdmin(ctx) {
		id := getUUID(r, "auth_account_id")
		if id != uuid.Nil {
			a.AuthAccountID = id
		}
	}

	// Delete session
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, a.DeleteAll(ctx)))
}

// AuthSessionUpdate updates an AuthSession permissions.
// @Accept json
// @ID AuthSessionUpdate
// @Param body body models.AuthSession true "AuthSession"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/sessions/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Update AuthSession
// @Tags AuthSession
func (*Handler) AuthSessionUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthSession

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Copy contexts
	a.Admin = false
	a.AuthAccountID = models.GetAuthAccountID(ctx)

	// Compare existing permissions
	p := getPermissions(ctx)
	if p.AuthAccountPermissions != nil && p.AuthAccountPermissions.IsEscalated(a.PermissionsAccount) || p.AuthHouseholdsPermissions != nil && p.AuthHouseholdsPermissions.IsEscalated(a.PermissionsHouseholds) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Check if user is enrolling push notifications, send one
	if webpush := getWebPush(ctx); a.WebPush != webpush {
		n := models.Notification{
			AuthAccountID:  &a.AuthAccountID,
			BodyWebPush:    "Your device will now receive reminders from Homechart.",
			SubjectWebPush: "Homechart Notifications Enabled",
			ToWebPush: notify.WebPushClients{
				a.WebPush,
			},
		}

		go n.Send(context.Background(), nil) //nolint:errcheck
	}

	// Update session
	err := a.Update(ctx)
	a.Key = uuid.Nil

	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, err))
}

// AuthSessionsRead reads all AuthSessions for an AuthHousehold.
// @Accept json
// @ID AuthSessionRead
// @Produce json
// @Router /auth/sessions [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Read all AuthSessions
// @Tags AuthSession
func (*Handler) AuthSessionsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get fields from ctx
	aa := models.GetAuthAccountID(ctx)

	a, err := models.AuthSessionsReadAll(ctx, aa)

	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, err))
}
