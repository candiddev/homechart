package controllers

import (
	"fmt"
	"io"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// CloudBackupCreate writes a backup to the endpoint.
func (h *Handler) CloudBackupCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ahid := getUUID(r, "self_hosted_id")

	if h.Info.Cloud {
		ah, err := authHouseholdReadAndCheckExpire(ctx, types.UUIDToNullUUID(ahid))
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		b := models.CloudBackup{
			AuthHouseholdID: ah.ID,
		}

		var e error

		b.Data, e = io.ReadAll(r.Body)
		if e != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest, e.Error()))

			return
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, b.Create(ctx)))

		return
	}

	p := getPermissions(ctx)

	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&ahid, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	ah := models.AuthHousehold{
		ID: ahid,
	}

	if err := ah.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	d, err := models.DataFromDatabase(ctx, ahid)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	err = d.Send(ctx, ah.ID, string(ah.BackupEncryptionKey))
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))
}

// CloudBackupDelete writes a backup to the endpoint.
func (h *Handler) CloudBackupDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ahid := getUUID(r, "self_hosted_id")

	if h.Info.Cloud {
		ah := models.AuthHousehold{
			SelfHostedID: types.UUIDToNullUUID(ahid),
		}

		if err := ah.Read(ctx); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		c := models.CloudBackup{
			AuthHouseholdID: ah.ID,
			ID:              getUUID(r, "cloud_backup_id"),
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, c.Delete(ctx)))

		return
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&ahid, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "DELETE", fmt.Sprintf("/api/v1/cloud/%s/backups/%s", ahid, getUUID(r, "cloud_backup_id")), nil)
	logger.Error(ctx, err) //nolint:errcheck
}

// CloudBackupsRead gets a list of backups from an endpoint and returns them to the client.
func (h *Handler) CloudBackupsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ahid := getUUID(r, "self_hosted_id")

	if h.Info.Cloud {
		ah, err := authHouseholdReadAndCheckExpire(ctx, types.UUIDToNullUUID(ahid))
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		backups, err := models.CloudBackupsRead(ctx, ah.ID)
		WriteResponse(ctx, w, backups, nil, len(backups), "", logger.Error(ctx, err))

		return
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&ahid, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "GET", fmt.Sprintf("/api/v1/cloud/%s/backups", ahid), nil)
	logger.Error(ctx, err) //nolint:errcheck
}

// CloudBackupRead reads a backup from an endpoint, possibly to restore it.
func (h *Handler) CloudBackupRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ahid := getUUID(r, "self_hosted_id")

	if h.Info.Cloud {
		ah, err := authHouseholdReadAndCheckExpire(ctx, types.UUIDToNullUUID(ahid))
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		data := models.CloudBackupRead(ctx, ah.ID, getUUID(r, "cloud_backup_id"))

		_, e := w.Write(data)
		if e != nil {
			err = errs.ErrReceiver.Wrap(e)
		}

		logger.Error(ctx, err) //nolint:errcheck

		return
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&ahid, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	id := getUUID(r, "cloud_backup_id")

	r, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/v1/cloud/%s/backups/%s", h.Config.App.CloudEndpoint, ahid, id), nil)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	client := &http.Client{}

	res, err := client.Do(r)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrReceiver.Wrap(err)))

		return
	}

	defer res.Body.Close()

	backup, err := io.ReadAll(res.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrReceiver.Wrap(err)))

		return
	}

	ah := models.AuthHousehold{
		ID: ahid,
	}

	if err := ah.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	d, e := models.DataFromByte(ctx, backup, string(ah.BackupEncryptionKey))
	if e != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, e))

		return
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, d.Restore(ctx, false)))
}
