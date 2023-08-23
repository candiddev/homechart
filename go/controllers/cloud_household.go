package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

type cloudHousehold struct {
	EmailAddress types.EmailAddress `json:"emailAddress"`
	Password     types.Password     `json:"password"`
}

func authHouseholdReadAndCheckExpire(ctx context.Context, selfHostedID *uuid.NullUUID) (*models.AuthHousehold, errs.Err) {
	ah := models.AuthHousehold{
		SelfHostedID: selfHostedID,
	}

	if err := ah.Read(ctx); err != nil {
		return &ah, err
	}

	if ah.IsExpired() {
		return &ah, errs.ErrClientPaymentRequired
	}

	return &ah, nil
}

func (h *Handler) proxyCloudRequest(ctx context.Context, w http.ResponseWriter, method, path string, body io.Reader) errs.Err {
	r, err := http.NewRequestWithContext(ctx, method, fmt.Sprintf("%s%s", h.Config.App.CloudEndpoint, path), body)
	if err != nil {
		e := errs.NewServerErr(err)
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, e))

		return e
	}

	client := &http.Client{}

	res, err := client.Do(r)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)

		return logger.Log(ctx, errs.NewServerErr(err))
	}

	defer res.Body.Close()

	w.Header().Set("content-type", "application/json")
	w.WriteHeader(res.StatusCode)

	_, err = io.Copy(w, res.Body)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	return logger.Log(ctx, nil)
}

// CloudHouseholdCreate creates a new AuthHousehold using just an email address.
func (h *Handler) CloudHouseholdCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		id := getUUID(r, "self_hosted_id")

		// Get email address from body
		var c cloudHousehold

		if err := getJSON(ctx, &c, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		s, err := h.createAuthAccount(ctx, r, &models.AuthAccount{
			EmailAddress: c.EmailAddress,
			Password:     c.Password,
			ToSAccepted:  true,
			SelfHostedID: types.UUIDToNullUUID(id),
		}, true)

		WriteResponse(ctx, w, s, nil, 1, "", logger.Log(ctx, err))

		return
	}

	// Get household from body
	var c cloudHousehold

	if err := getJSON(ctx, &c, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	j, err := json.Marshal(c)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.NewServerErr(err)))

		return
	}

	logger.Log(ctx, h.proxyCloudRequest(ctx, w, "POST", fmt.Sprintf("/api/v1/cloud/%s", getUUID(r, "self_hosted_id")), bytes.NewBuffer(j))) //nolint:errcheck
}

// CloudHouseholdRead verifies if an AuthHouseholdID is enabled for cloud features.
func (h *Handler) CloudHouseholdRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		id := getUUID(r, "self_hosted_id")

		if id == uuid.Nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

			return
		}

		ah := models.AuthHousehold{
			SelfHostedID: types.UUIDToNullUUID(id),
		}

		WriteResponse(ctx, w, ah, nil, 1, "", logger.Log(ctx, ah.Read(ctx)))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "GET", fmt.Sprintf("/api/v1/cloud/%s", getUUID(r, "self_hosted_id")), nil)
	logger.Log(ctx, err) //nolint:errcheck
}

// CloudHouseholdReadJWT returns a JWT for a household from the cloud.
func (h *Handler) CloudHouseholdReadJWT(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		id := getUUID(r, "self_hosted_id")

		if id == uuid.Nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

			return
		}

		ah := models.AuthHousehold{
			SelfHostedID: types.UUIDToNullUUID(id),
		}

		jwt, err := ah.CreateJWT(ctx)
		if err == nil {
			w.Write([]byte(jwt)) //nolint:errcheck
		} else {
			w.WriteHeader(http.StatusNotFound)
		}

		logger.Log(ctx, err) //nolint:errcheck

		return
	}

	id := getUUID(r, "self_hosted_id")

	p := getPermissions(ctx)

	if p.AuthHouseholdsPermissions == nil || !p.AuthHouseholdsPermissions.IsPermitted(&id, models.PermissionComponentAuth, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

		return
	}

	ah := models.AuthHousehold{
		ID: id,
	}

	WriteResponse(ctx, w, ah, nil, 0, "", logger.Log(ctx, ah.ReadJWT(ctx, true)))
}

// CloudHouseholdUpdate updates a CloudHousehold.
func (h *Handler) CloudHouseholdUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		id := getUUID(r, "self_hosted_id")

		if id == uuid.Nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

			return
		}

		// Get updates from body
		var ah models.AuthHousehold

		if err := getJSON(ctx, &ah, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		ah.SelfHostedID = types.UUIDToNullUUID(id)

		err := ah.UpdateSelfHosted(ctx)

		WriteResponse(ctx, w, ah, nil, 1, "", logger.Log(ctx, err))

		return
	}

	logger.Log(ctx, h.proxyCloudRequest(ctx, w, "PUT", fmt.Sprintf("/api/v1/cloud/%s", getUUID(r, "self_hosted_id")), r.Body)) //nolint:errcheck
}
