package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
)

func TestNotificationsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 50; i++ {
		n := Notification{
			BodySMTP:    "test",
			SubjectSMTP: "test",
			SendAfter:   GenerateTimestamp(),
		}
		_ = n.create(ctx, CreateOpts{})
	}

	assert.Equal(t, NotificationsDelete(ctx), nil)

	n, _ := NotificationsRead(ctx)

	assert.Equal(t, len(n), 0)
}

func TestNotificationsRead(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 50; i++ {
		n := Notification{
			BodySMTP:    "test",
			SubjectSMTP: "test",
			SendAfter:   GenerateTimestamp(),
		}
		_ = n.create(ctx, CreateOpts{})
	}

	got, err := NotificationsRead(ctx)
	assert.Equal(t, err, nil)
	assert.Equal(t, len(got), 50)

	NotificationsDelete(ctx)
}

func TestNotificationsReadQueue(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 50; i++ {
		n := Notification{
			BodySMTP:    "test",
			SubjectSMTP: "test",
			SendAfter:   GenerateTimestamp(),
		}

		if i%2 == 0 {
			n.SendAfter = n.SendAfter.Add(10 * time.Hour)
		}

		_ = n.create(ctx, CreateOpts{})
	}

	got, err := NotificationsReadQueue(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(*got), 25)

	got, err = NotificationsReadQueue(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(*got), 0)

	NotificationsDelete(ctx)

	got, err = NotificationsReadQueue(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(*got), 0)
}

func TestNotificationDelete(t *testing.T) {
	logger.UseTestLogger(t)

	n := Notification{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		BodySMTP:      "Notification body",
		ToSMTP:        "recipient1",
		SendAfter:     GenerateTimestamp(),
	}

	n.create(ctx, CreateOpts{})

	output := Notification{
		AuthAccountID: n.AuthAccountID,
		ID:            n.ID,
	}

	assert.Equal(t, n.Delete(ctx), nil)

	Read(ctx, &output, ReadOpts{})

	assert.Equal(t, output, Notification{
		AuthAccountID: n.AuthAccountID,
		ID:            n.ID,
		SendStart:     output.SendStart,
	})

	n.Delete(ctx)
}

func TestNotificationSend(t *testing.T) {
	logger.UseTestLogger(t)

	as := seed.AuthSessions[0]
	as.WebPush = &notify.WebPushClient{
		Auth:     "1",
		Endpoint: "3",
		P256:     "2",
	}
	as.Create(ctx, false)

	tests := map[string]struct {
		err          error
		newsletter   bool
		toSMTP       types.EmailAddress
		toWebPush    *notify.WebPushClient
		testErr      errs.Err
		testNotifier bool
	}{
		"none": {},
		"test": {
			testNotifier: true,
		},
		"smtp": {
			err:    notify.ErrCancelled,
			toSMTP: "test@example.com",
		},
		"smtp - queue": {
			toSMTP:       "text@example.com",
			testErr:      errs.NewServerErr(notify.ErrSend),
			testNotifier: true,
		},
		"webpush": {
			err: notify.ErrCancelled,
			toWebPush: &notify.WebPushClient{
				Endpoint: "endpoint1",
			},
		},
		"webpush - missing": {
			err:          notify.ErrMissing,
			toWebPush:    as.WebPush,
			testErr:      errs.NewServerErr(notify.ErrMissing),
			testNotifier: true,
		},
		"webpush - queue": {
			toWebPush: &notify.WebPushClient{
				Endpoint: "endpoint1",
			},
			testErr:      errs.NewServerErr(notify.ErrSend),
			testNotifier: true,
		},
		"newsletter no valid": {
			newsletter: true,
		},
		"newsletter test": {
			testErr:      errs.NewServerErr(notify.ErrSend),
			newsletter:   true,
			testNotifier: true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			notify.Test.Error(tc.testErr)
			notify.Test.SMTPMessages()
			notify.Test.WebPushMessages()

			c.App.TestNotifier = tc.testNotifier
			n := &Notification{
				BodySMTP:    "smtp",
				BodyWebPush: "fcm",
				Newsletter:  tc.newsletter,
				ToSMTP:      tc.toSMTP.String(),
			}

			if tc.toWebPush != nil {
				n.ToWebPush = notify.WebPushClients{
					tc.toWebPush,
				}
			}

			assert.HasErr(t, n.Send(ctx, nil), tc.err)

			if tc.newsletter && tc.testNotifier {
				assert.Equal(t, len(notify.Test.SMTPMessages()), 4)
			}

			if tc.testErr != nil {
				n, _ := NotificationsReadQueue(ctx)

				switch {
				case tc.newsletter:
					assert.Equal(t, len(*n), 0)
				case tc.err == notify.ErrMissing:
					as.Read(ctx, false)
					assert.Equal(t, as.WebPush, nil)
				default:
					assert.Equal(t, len(*n), 1)
					(*n)[0].Delete(ctx)
				}
			}
		})
	}

	c.App.TestNotifier = true

	notify.Test.Error(errs.NewServerErr(notify.ErrSend))

	// Test retry queue
	n := Notification{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		BodyWebPush:   "test",
		ToWebPush: notify.WebPushClients{
			{
				Endpoint: "1",
			},
		},
	}

	assert.Equal(t, n.Send(ctx, nil), nil)

	q, _ := NotificationsRead(ctx)

	assert.Equal(t, len(q), 1)
	assert.Equal(t, n.Send(ctx, nil), nil)
	assert.Equal(t, n.Attempt, 1)

	n.Attempt = 3
	n.update(ctx, UpdateOpts{})

	assert.Equal(t, n.Send(ctx, nil), nil)
	assert.Equal(t, n.Attempt, 4)

	q, _ = NotificationsRead(ctx)

	assert.Equal(t, len(q), 0)

	c.App.TestNotifier = false
}

func TestNotificationCreate(t *testing.T) {
	logger.UseTestLogger(t)

	n := Notification{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		BodySMTP:      "Notification body",
		ToSMTP:        "recipient1",
		SendAfter:     GenerateTimestamp(),
		SubjectSMTP:   "Notification subject",
	}

	assert.Equal(t, n.create(ctx, CreateOpts{}), nil)

	output := Notification{
		AuthAccountID: n.AuthAccountID,
		ID:            n.ID,
	}

	assert.Equal(t, Read(ctx, &output, ReadOpts{}), nil)
	assert.Equal(t, output, n)

	n.Delete(ctx)
}

func TestNotificationUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	n := Notification{
		AuthAccountID: &seed.AuthAccounts[0].ID,
	}
	n.create(ctx, CreateOpts{})

	n.BodyWebPush = "Notification body fcm"
	n.BodySMTP = "Notification body smtp"
	n.ToWebPush = notify.WebPushClients{
		{
			Endpoint: "1",
		},
		{
			Endpoint: "2",
		},
	}
	n.ToSMTP = "recipient3"
	n.SendAfter = GenerateTimestamp()

	assert.Equal(t, n.update(ctx, UpdateOpts{}), nil)

	output := Notification{
		AuthAccountID: n.AuthAccountID,
		ID:            n.ID,
	}

	Read(ctx, &output, ReadOpts{})

	assert.Equal(t, output, n)

	n.Delete(ctx)
}
