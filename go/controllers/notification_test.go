package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
)

func TestNotificationCreate(t *testing.T) {
	logger.UseTestLogger(t)

	admin := seed.AuthSessions[0]
	admin.Admin = true
	admin.Create(ctx, false)

	tests := map[string]struct {
		err     string
		session models.AuthSession
	}{
		"not admin": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[0],
		},
		"admin": {
			session: admin,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var n models.Notifications

			msg := request{
				data: models.Notification{
					Newsletter:  true,
					SubjectSMTP: "Testing",
				},
				method:       "POST",
				responseType: &n,
				session:      tc.session,
				uri:          "/notifications",
			}.do()

			assert.Equal(t, msg.Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, n[0].Newsletter, true)
				assert.Equal(t, n[0].ToSMTP, "")

				n[0].Delete(ctx)
			}
		})
	}

	admin.Delete(ctx)
}

func TestNotificationDelete(t *testing.T) {
	logger.UseTestLogger(t)

	n := models.Notification{
		SubjectSMTP: "Testing",
	}
	models.Create(ctx, &n, models.CreateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: true,
		},
	})

	admin := seed.AuthSessions[0]
	admin.Admin = true
	admin.Create(ctx, false)

	tests := map[string]struct {
		err     string
		session models.AuthSession
		uri     string
	}{
		"invalid id": {
			err:     errs.ErrSenderBadRequest.Message(),
			session: admin,
			uri:     "/notifications/safdsafsadf",
		},
		"not admin": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[0],
			uri:     "/notifications/" + n.ID.String(),
		},
		"good": {
			uri:     "/notifications/" + n.ID.String(),
			session: admin,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, request{
				method:  "DELETE",
				session: tc.session,
				uri:     tc.uri,
			}.do().Error(), tc.err)
		})
	}

	n.Delete(ctx)
	admin.Delete(ctx)
}

func TestNotificationUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	n := models.Notification{
		SubjectSMTP: "Testing",
	}
	models.Create(ctx, &n, models.CreateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: true,
		},
	})

	admin := seed.AuthSessions[0]
	admin.Admin = true
	admin.Create(ctx, false)

	tests := map[string]struct {
		err     string
		session models.AuthSession
		uri     string
	}{
		"invalid id": {
			err:     errs.ErrSenderBadRequest.Message(),
			session: admin,
			uri:     "/notifications/aaa",
		},
		"not admin": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[0],
			uri:     "/notifications/" + n.ID.String(),
		},
		"good": {
			session: admin,
			uri:     "/notifications/" + n.ID.String(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			n.SubjectSMTP = "Testing34"
			assert.Equal(t, request{
				data:    n,
				method:  "PUT",
				session: tc.session,
				uri:     tc.uri,
			}.do().Error(), tc.err)
		})
	}

	n.Delete(ctx)
	admin.Delete(ctx)
}

func TestNotificationsRead(t *testing.T) {
	logger.UseTestLogger(t)

	notify.Test.SMTPMessages()

	opts := models.CreateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: true,
		},
	}

	n1 := models.Notification{
		SubjectSMTP: "Testing1",
	}
	models.Create(ctx, &n1, opts)

	n2 := models.Notification{
		SubjectSMTP: "Testing2",
	}
	models.Create(ctx, &n2, opts)

	admin := seed.AuthSessions[0]
	admin.Admin = true
	admin.Create(ctx, false)

	var n models.Notifications

	r := request{
		method:       "GET",
		responseType: &n,
		session:      admin,
		uri:          "/notifications",
	}

	noError(t, r.do())
	assert.Equal(t, len(n), 2)

	admin.Delete(ctx)
	n1.Delete(ctx)
	n2.Delete(ctx)

	r.session = seed.AuthSessions[0]

	assert.Equal(t, r.do().Error(), errs.ErrSenderForbidden.Message())
}
