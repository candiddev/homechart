package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func TestCloudBackupCloud(t *testing.T) {
	logger.UseTestLogger(t)

	h.Info.Cloud = true

	ah1 := seed.AuthHouseholds[0]
	ah1.SelfHostedID = types.UUIDToNullUUID(seed.AuthHouseholds[0].ID)
	ah1.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	ah1.Create(ctx, false)

	ah2 := seed.AuthHouseholds[0]
	ah2.SelfHostedID = types.UUIDToNullUUID(seed.AuthHouseholds[1].ID)
	ah2.SubscriptionExpires = types.CivilDateToday().AddDays(10)
	ah2.Create(ctx, false)

	// Test create backup
	tests := map[string]struct {
		err string
		id  uuid.UUID
	}{
		"expired": {
			err: errs.ErrSenderPaymentRequired.Message(),
			id:  ah1.SelfHostedID.UUID,
		},
		"good": {
			id: ah2.SelfHostedID.UUID,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/api/v1/cloud/%s/backups", ts.URL, tc.id), bytes.NewBufferString("test"))
			client := &http.Client{}
			res, _ := client.Do(r)

			msg := &Response{}
			json.NewDecoder(res.Body).Decode(msg)

			assert.Equal(t, msg.Error(), tc.err)

			backups := models.CloudBackups{}

			// Test get list of backups
			assert.Equal(t, request{
				method:       "GET",
				responseType: &backups,
				uri:          fmt.Sprintf("/cloud/%s/backups", tc.id),
			}.do().Error(), tc.err)

			if name == "good" {
				assert.Equal(t, len(backups), 1)
			}

			// Test retreiving a backup
			id := models.GenerateUUID()

			if name == "good" {
				id = backups[0].ID
			}

			r, _ = http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/v1/cloud/%s/backups/%s", ts.URL, tc.id, id), nil)
			res, _ = client.Do(r)
			body, _ := io.ReadAll(res.Body)

			if name == "good" {
				assert.Equal(t, string(body), "test")

				backups[0].Delete(ctx)
			}
		})
	}

	ah1.Delete(ctx)
	ah2.Delete(ctx)
}

func TestCloudBackupNotCloud(t *testing.T) {
	logger.UseTestLogger(t)

	backup, _ := models.DataFromDatabase(ctx, seed.AuthHouseholds[0].ID)
	data, _ := backup.ExportByte(ctx, string(seed.AuthHouseholds[0].BackupEncryptionKey))

	id := models.GenerateUUID()

	ah := seed.AuthHouseholds[0]
	ah.SelfHostedID = types.UUIDToNullUUID(seed.AuthAccounts[0].ID)
	ah.Update(ctx)

	ri := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == "GET" && r.URL.Path == fmt.Sprintf("/api/v1/cloud/%s/backups", ah.ID):
			if ri == 0 {
				WriteResponse(ctx, w, models.CloudBackups{
					{
						ID: id,
					},
					{
						ID: models.GenerateUUID(),
					},
				}, nil, 2, "", nil)
			} else {
				WriteResponse(ctx, w, models.CloudBackups{
					{
						ID: id,
					},
				}, nil, 1, "", nil)
			}

			ri++
		case r.Method == "GET" && strings.Contains(r.URL.Path, "/backups/"):
			w.Write(data)

			return
		default:
			WriteResponse(ctx, w, nil, nil, 0, "", nil)

			return
		}
	}))

	defer srv.Close()

	endpoint := h.Config.App.CloudEndpoint
	h.Config.App.CloudEndpoint = srv.URL
	h.Info.Cloud = false
	h.Router = chi.NewRouter()
	h.Routes(ctx)
	ts = httptest.NewServer(h.Router)

	tests := map[string]struct {
		err     string
		session models.AuthSession
	}{
		"not owner": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[1],
		},
		"owner": {
			session: seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, request{
				method:  "POST",
				session: tc.session,
				uri:     fmt.Sprintf("/cloud/%s/backups", ah.ID),
			}.do().Error(), tc.err)

			assert.Equal(t, request{
				method:  "POST",
				session: tc.session,
				uri:     fmt.Sprintf("/cloud/%s/backups", ah.ID),
			}.do().Error(), tc.err)

			var backups models.CloudBackups

			assert.Equal(t, request{
				responseType: &backups,
				method:       "GET",
				session:      tc.session,
				uri:          fmt.Sprintf("/cloud/%s/backups", ah.ID),
			}.do().Error(), tc.err)

			id := models.GenerateUUID()

			if name == "owner" {
				assert.Equal(t, len(backups), 2)
				id = backups[0].ID
			}

			assert.Equal(t, request{
				responseType: &backups,
				method:       "DELETE",
				session:      tc.session,
				uri:          fmt.Sprintf("/cloud/%s/backups/%s", ah.ID, id),
			}.do().Error(), tc.err)

			assert.Equal(t, request{
				responseType: &backups,
				method:       "GET",
				session:      tc.session,
				uri:          fmt.Sprintf("/cloud/%s/backups", ah.ID),
			}.do().Error(), tc.err)

			if name == "owner" {
				assert.Equal(t, len(backups), 1)

				id = backups[0].ID
			}

			assert.Equal(t, request{
				method:  "GET",
				session: tc.session,
				uri:     fmt.Sprintf("/cloud/%s/backups/%s", ah.ID, id),
			}.do().Error(), tc.err)

			if name == "owner" {
				ah := models.AuthHousehold{
					ID: seed.AuthHouseholds[0].ID,
				}

				assert.Equal(t, ah.Read(ctx), nil)

				aa := models.AuthAccount{
					ID: seed.AuthAccounts[0].ID,
				}

				assert.Equal[error](t, aa.Read(ctx), errs.ErrSenderNotFound)
			}
		})
	}

	seed, _ = models.Seed(ctx, false)

	h.Config.App.CloudEndpoint = endpoint
	h.Info.Cloud = true
	h.Router = chi.NewRouter()
	h.Routes(ctx)
	ts = httptest.NewServer(h.Router)
}
