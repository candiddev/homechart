package models

import (
	"context"
	"sync"
	"time"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/google/uuid"
)

// Notification is used by the notifications package.
type Notification struct {
	ID             uuid.UUID              `db:"id" json:"id"`
	AuthAccountID  *uuid.UUID             `db:"auth_account_id" json:"authAccountID"`
	Preferences    AuthAccountPreferences `db:"-" json:"-"`
	Attempt        int                    `db:"attempt" json:"attempt"`
	Actions        notify.WebPushActions  `db:"actions" json:"actions"`
	BodySMTP       string                 `db:"body_smtp" json:"bodySMTP"`
	BodyWebPush    string                 `db:"body_web_push" json:"bodyWebPush"`
	ISO639Code     yaml8n.ISO639Code      `db:"iso_639_code" json:"iso639Code"`
	Newsletter     bool                   `db:"newsletter" json:"newsletter"`
	SendStart      *time.Time             `db:"send_start" json:"-"`
	SubjectSMTP    string                 `db:"subject_smtp" json:"subjectSMTP"`
	SubjectWebPush string                 `db:"subject_web_push" json:"subjectWebPush"`
	ToSMTP         string                 `db:"to_smtp" json:"toSMTP"`
	ToWebPush      notify.WebPushClients  `db:"to_web_push" json:"toWebPush"`
	Created        time.Time              `db:"created" format:"date-time" json:"created"`
	SendAfter      time.Time              `db:"send_after" json:"sendAfter"`
}

// Notification types for web push.
const (
	NotificationActionsTypesMarkComplete notify.WebPushActionType = iota
	NotificationActionsTypesSnooze
)

// Delete removes a notification.
func (n *Notification) Delete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Log(ctx, db.Exec(ctx, "DELETE FROM notification WHERE id = :id", n))
}

// Send sends a notification using the notifier.
func (n *Notification) Send(ctx context.Context, wg *sync.WaitGroup) errs.Err { //nolint:gocognit
	if wg != nil {
		defer wg.Done()
	}

	var err errs.Err

	var smtp []string

	var webPush notify.WebPushClients

	if n.AuthAccountID == nil && n.Newsletter {
		ns := AuthAccountsReadNotifications(ctx, nil, nil, AuthAccountNotifyTypeNewsletter)
		for i := range ns {
			webPush = append(webPush, ns[i].ToWebPush...)
			smtp = append(smtp, ns[i].ToSMTP)
		}
	} else {
		webPush = n.ToWebPush

		if n.ToSMTP != "" {
			smtp = []string{
				n.ToSMTP,
			}
		}
	}

	if len(webPush) > 0 && n.BodyWebPush != "" {
		w := notify.WebPushClients{}

		for i := range webPush {
			msg := notify.WebPushMessage{
				Actions: n.Actions,
				Body:    n.BodyWebPush,
				Client:  webPush[i],
				Subject: n.SubjectWebPush,
			}

			if c.App.TestNotifier {
				err = notify.Test.SendWebPush(ctx, msg)
			} else {
				err = c.WebPush.Send(ctx, &msg)
			}

			if err != nil {
				logger.Log(ctx, err) //nolint:errcheck

				if err.Is(notify.ErrMissing) {
					logger.Log(ctx, AuthSessionDeleteWebPush(ctx, webPush[i].Endpoint)) //nolint:errcheck
				} else if !err.Is(notify.ErrCancelled) {
					w = append(w, webPush[i])
				}
			}
		}

		n.ToWebPush = w
	}

	if len(smtp) > 0 && n.BodySMTP != "" {
		for i := range smtp {
			msg := notify.SMTPMessage{
				Body:         n.BodySMTP,
				FooterFrom:   yaml8n.EmailFooterFrom.Translate(n.ISO639Code),
				FooterUpdate: yaml8n.EmailFooterUpdate.Translate(n.ISO639Code),
				Subject:      n.SubjectSMTP,
				To:           smtp[i],
			}

			if c.App.TestNotifier {
				err = notify.Test.SendSMTP(ctx, msg)
			} else {
				err = c.SMTP.Send(ctx, msg)
			}

			logger.Log(ctx, err) //nolint:errcheck

			if err == nil || err.Is(notify.ErrCancelled) {
				n.ToSMTP = ""
			}
		}
	}

	if n.Newsletter { // Never error for newsletter, no retries
		return logger.Log(ctx, nil)
	} else if (n.ToSMTP != "" && n.BodySMTP != "") || (len(n.ToWebPush) > 0 && n.BodyWebPush != "") {
		if n.ID == uuid.Nil {
			err = n.create(ctx, CreateOpts{})
		} else {
			n.Attempt++
			if n.Attempt > 3 {
				err = n.Delete(ctx)
			} else {
				err = n.update(ctx, UpdateOpts{})
			}
		}

		return logger.Log(ctx, err)
	}

	return logger.Log(ctx, err)
}

func (n *Notification) SetID(id uuid.UUID) {
	n.ID = id
}

func (n *Notification) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Set fields
	n.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, n, `
INSERT INTO notification (
	  actions
	, auth_account_id
	, body_smtp
	, body_web_push
	, id
	, newsletter
	, to_smtp
	, to_web_push
	, send_after
	, subject_smtp
	, subject_web_push
) VALUES (
	  :actions
	, :auth_account_id
	, :body_smtp
	, :body_web_push
	, :id
	, :newsletter
	, :to_smtp
	, :to_web_push
	, :send_after
	, :subject_smtp
	, :subject_web_push
)
RETURNING *
`, n))
}

func (*Notification) getChange(_ context.Context) string {
	return ""
}

func (n *Notification) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return n.AuthAccountID, nil, &n.ID
}

func (*Notification) getType() modelType {
	return modelNotification
}

func (*Notification) setIDs(_, _ *uuid.UUID) {}

func (n *Notification) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Log(ctx, db.Query(ctx, false, n, `
UPDATE notification
SET
	  actions = :actions
	, attempt = :attempt
	, body_smtp = :body_smtp
	, body_web_push = :body_web_push
	, newsletter = :newsletter
	, to_smtp = :to_smtp
	, to_web_push = :to_web_push
	, send_after = :send_after
	, send_start = null
	, subject_smtp = :subject_smtp
	, subject_web_push = :subject_web_push
WHERE id = :id
RETURNING *
`, n))
}

// Notifications is a slice of Notifications.
type Notifications []Notification

// NotificationsDelete removes all notifications in the database.
func NotificationsDelete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Log(ctx, db.Exec(ctx, "DELETE FROM notification", nil))
}

// NotificationsRead reads all notifications in the database.
func NotificationsRead(ctx context.Context) (Notifications, errs.Err) {
	ctx = logger.Trace(ctx)

	n := Notifications{}

	return n, logger.Log(ctx, db.Query(ctx, true, &n, "SELECT * FROM notification", nil))
}

// NotificationsReadQueue reads all notifications ready to be sent.
func NotificationsReadQueue(ctx context.Context) (*Notifications, errs.Err) {
	ctx = logger.Trace(ctx)

	var n Notifications

	err := db.Query(ctx, true, &n, `
UPDATE notification
	SET send_start = now()
WHERE send_after < now()
AND (
	send_start IS NULL
	OR send_start < now() - interval '30 minutes'
)
RETURNING *
`, nil)
	if err != nil || len(n) != 0 {
		logger.Log(ctx, err) //nolint:errcheck
	}

	return &n, err
}
