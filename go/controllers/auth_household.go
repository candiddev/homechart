package controllers

import (
	"errors"
	"io"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AuthHouseholdCreate creates an AuthHousehold using POST data.
// @Accept json
// @ID AuthHouseholdCreate
// @Param body body models.AuthHousehold true "AuthHousehold"
// @Produce json
// @Success 200 {object} Response{dataValue=models.AuthHousehold}
// @Summary Create AuthHousehold
// @Router /auth/households [post]
// @Tags AuthHousehold
func (h *Handler) AuthHouseholdCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if getChild(ctx) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Get AuthHousehold from body
	var ah models.AuthHousehold

	if err := getJSON(ctx, &ah, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	a := models.AuthAccount{
		ID: models.GetAuthAccountID(ctx),
	}
	if err := a.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	ah.SubscriptionExpires = types.CivilDateToday().AddDays(h.Config.App.TrialDays)

	if err := ah.Create(ctx, false); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a.ID,
		AuthHouseholdID: ah.ID,
	}
	if err := models.Create(ctx, &aaah, models.CreateOpts{}); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if err := models.InitHousehold(ctx, ah.ID, a.ID); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Get Account ID
	WriteResponse(ctx, w, ah, nil, 0, "", logger.Error(ctx, ah.Read(ctx)))
}

// AuthHouseholdDelete deletes an AuthHousehold using URL parameters.
// @Accept json
// @ID AuthHouseholdDelete
// @Param id path string true "ID"
// @Produce json
// @Router /auth/households/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete AuthHousehold
// @Tags AuthAccount
func (*Handler) AuthHouseholdDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Account ID
	a := models.AuthHousehold{
		ID: getUUID(r, "auth_household_id"),
	}

	if !getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&a.ID, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Delete account
	err := a.Delete(ctx)

	logger.Info(ctx, noticeAuthHouseholdDeleted, a.ID.String())
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))
}

// AuthHouseholdExport exports all household data.
func (*Handler) AuthHouseholdExport(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Only household admins can export
	ah := getUUID(r, "auth_household_id")
	if !getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	data, err := models.DataFromDatabase(ctx, ah)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	export, err := data.ExportByte(ctx, "")
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if _, err := w.Write(export); err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

		return
	}
}

// AuthHouseholdInviteAccept assigns an AuthHousehold invite to an AuthAccount.
// @Accept json
// @ID AuthHouseholdInviteAccept
// @Param id path string true "ID"
// @Param token path string true "Token"
// @Produce json
// @Router /auth/households/{id}/invites/{token} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Accept an invite to an AuthHousehold
// @Tags AuthHousehold
func (*Handler) AuthHouseholdInviteAccept(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	aa := models.GetAuthAccountID(ctx)

	// Get AuthAccount inviter
	a := models.AuthAccountAuthHousehold{
		AuthAccountID: &aa,
		InviteToken:   types.StringLimit(chi.URLParam(r, "invite_token")),
	}

	err := a.InviteAccept(ctx)

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))
}

// AuthHouseholdInviteCreate creates a new AuthAccountAuthHousehold for an existing household.
// @Accept json
// @ID AuthHouseholdInviteCreate
// @Param body body models.AuthAccount true "AuthAccountAuthHousehold"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/households/{id}/invites [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Invite an AuthAccount to an AuthHousehold
// @Tags AuthHousehold
func (h *Handler) AuthHouseholdInviteCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ah := getUUID(r, "auth_household_id")

	p := getPermissions(ctx)
	if !p.AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Get AuthAccount inviter
	ai := models.AuthAccount{
		ID: models.GetAuthAccountID(ctx),
	}

	err := ai.Read(ctx)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	inviter := string(ai.Name)
	if ai.Name == "" {
		inviter = ai.EmailAddress.String()
	}

	// Get AuthAccount from body
	var a models.AuthAccountAuthHousehold

	err = getJSON(ctx, &a, r.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if !a.Child && a.EmailAddress == "" {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	a.AuthHouseholdID = ah

	// If child, create account
	if a.Child {
		aa := models.AuthAccount{
			Child: true,
			Name:  a.Name,
		}
		if err := aa.Create(ctx, false); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		a.AuthAccountID = &aa.ID
		a.EmailAddress = ""

		if err := models.Create(ctx, &a, models.CreateOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}
	} else {
		// Create the invite
		if err := a.InviteCreate(ctx); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}
	}

	if !a.Child {
		body := templates.EmailInviteBody(ai.ISO639Code, string(a.Name), inviter, h.Config.App.BaseURL, string(a.InviteToken))

		m := models.Notification{
			BodySMTP:    body,
			SubjectSMTP: templates.EmailInviteSubject(ai.ISO639Code, inviter),
			ToSMTP:      a.EmailAddress,
		}

		go m.Send(ctx, nil) //nolint:errcheck
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, nil))
}

// AuthHouseholdInviteDelete removes an AuthHousehold invite.
// @Accept json
// @ID AuthHouseholdInviteDelete
// @Param id path string true "ID"
// @Param token path string true "Token"
// @Produce json
// @Router /auth/households/{id}/invites/{token} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Accept an invite to an AuthHousehold
// @Tags AuthHousehold
func (*Handler) AuthHouseholdInviteDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount inviter
	a := models.AuthAccountAuthHousehold{
		InviteToken: types.StringLimit(chi.URLParam(r, "invite_token")),
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, a.InviteDelete(ctx)))
}

// AuthHouseholdImport imports household data.
func (h *Handler) AuthHouseholdImport(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud { // cloud should NEVER allow imports, who knows what they might contain.
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Only household admins can import
	ah := getUUID(r, "auth_household_id")
	if !getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	raw, er := io.ReadAll(r.Body)
	if er != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrReceiver.Wrap(er)))

		return
	}

	data, err := models.DataFromByte(ctx, raw, "")
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	err = data.Restore(ctx, false)
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))
}

// AuthHouseholdRead reads an AuthHousehold using URL parameters.
// @Accept json
// @ID AuthHouseholdRead
// @Param id path string true "ID"
// @Produce json
// @Router /auth/households/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthHouseholds}
// @Summary Read AuthHousehold
// @Tags AuthHousehold
func (*Handler) AuthHouseholdRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Household ID
	a := models.AuthHousehold{
		ID:      getUUID(r, "auth_household_id"),
		Updated: getUpdated(ctx),
	}

	// Read Household
	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, a.Read(ctx)))
}

// AuthHouseholdUpdate updates an AuthHousehold using PUT data.
// @Accept json
// @ID AuthHouseholdUpdate
// @Param body body models.AuthHousehold true "AuthHousehold"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/households/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthHouseholds}
// @Summary Update AuthHousehold
// @Tags AuthHousehold
func (*Handler) AuthHouseholdUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ah := getUUID(r, "auth_household_id")
	if !getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentAuth, models.PermissionEdit) && !getAuthSessionAdmin(ctx) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Get AuthHousehold from body
	var a models.AuthHousehold

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Get Household ID
	a.ID = ah

	var err errs.Err

	if getAuthSessionAdmin(ctx) {
		err = a.UpdateSubscription(ctx)

		if getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentAuth, models.PermissionEdit) {
			errUp := a.Update(ctx)

			if errors.Is(err, errs.ErrSenderNoContent) && !errors.Is(errUp, errs.ErrSenderNoContent) {
				err = errUp
			}
		}
	} else {
		err = a.Update(ctx)
	}

	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, err))
}

// AuthHouseholdsRead reads all AllHouseholds an account has access to.
// @Accept json
// @ID AuthHouseholdsRead
// @Produce json
// @Router /auth/households [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthHouseholds}
// @Summary Read all AuthHouseholds
// @Tags AuthHousehold
func (*Handler) AuthHouseholdsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var a models.AuthHouseholds

	var err errs.Err

	var total int

	ids := getPermissions(ctx).AuthHouseholdsPermissions.GetIDs()

	if getAuthSessionAdmin(ctx) && r.URL.Query().Has("filter") {
		id := models.ParseUUID(getFilter(ctx))

		if id != uuid.Nil {
			a, total, err = models.AuthHouseholdsRead(ctx, types.UUIDs{
				id,
			}, getOffset(ctx))
		} else {
			a, total, err = models.AuthHouseholdsRead(ctx, types.UUIDs{}, getOffset(ctx))
		}
	} else if len(ids) > 0 {
		a, total, err = models.AuthHouseholdsRead(ctx, ids, 0)
	}

	WriteResponse(ctx, w, a, nil, total, "", logger.Error(ctx, err))
}

// AuthHouseholdMemberDelete deletes an AuthHousehold member.
// @Accept json
// @ID AuthHouseholdMemberDelete
// @Param auth_account_id path string true "AuthAccountID"
// @Param auth_household_id path string true "AuthHouseholdID"
// @Produce json
// @Router /auth/households/{auth_household_id}/members/{auth_account_id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete AuthHouseholdMember
// @Tags AuthHousehold
func (*Handler) AuthHouseholdMemberDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	aa := getUUID(r, "auth_account_id")
	ah := getUUID(r, "auth_household_id")
	p := getPermissions(ctx)

	if aa == models.GetAuthAccountID(ctx) {
		p = models.PermissionsOpts{}
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, models.AuthHouseholdMemberDelete(ctx, aa, ah, p)))
}

// AuthHouseholdMemberUpdate updates an AuthHousehold member using PUT data.
// @Accept json
// @ID AuthHouseholdMemberUpdate
// @Param auth_account_id path string true "AuthAccountID"
// @Param auth_household_id path string true "AuthHouseholdID"
// @Param body body models.AuthAccount true "AuthAccount"
// @Produce json
// @Router /auth/households/{auth_household_id}/members/{auth_account_id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Update AuthHouseholdMember EmailAddress and Permissions
// @Tags AuthHousehold
func (*Handler) AuthHouseholdMemberUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccountAuthHousehold

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Get Household ID
	a.AuthHouseholdID = getUUID(r, "auth_household_id")
	aa := getUUID(r, "auth_account_id")
	a.AuthAccountID = &aa

	if aa == models.GetAuthAccountID(ctx) && !getPermissions(ctx).AuthHouseholdsPermissions.IsPermitted(&a.AuthHouseholdID, models.PermissionComponentAuth, models.PermissionEdit) {
		err := errs.ErrSenderForbidden
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	err := models.Update(ctx, &a, models.UpdateOpts{
		PermissionsOpts: getPermissions(ctx),
	})

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))
}
