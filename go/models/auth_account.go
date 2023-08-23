package models

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"image/png"
	"math/big"
	"regexp"
	"strconv"
	"text/template"
	"time"

	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

// ErrClientBadRequestTOTP means the TOTP passcode is incorrect.
var ErrClientBadRequestTOTP = errs.NewClientBadRequestErr("Incorrect passcode")

// AuthAccount defines the user account fields.
type AuthAccount struct {
	// The next timestamp for the agenda.
	DailyAgendaNext *time.Time `db:"daily_agenda_next" format:"date-time" json:"dailyAgendaNext"`

	// ICalendarID for the account.
	ICalendarID *uuid.NullUUID `db:"icalendar_id" format:"uuid" json:"icalendarID"`

	// SelfHosted ID of the account, used when creating CloudHouseholds.
	SelfHostedID *uuid.NullUUID `db:"-" format:"uuid" json:"selfHostedID,omitempty"`

	// Password reset token, used for password resets.
	PasswordResetToken *uuid.NullUUID `db:"password_reset_token" format:"uuid" json:"passwordResetToken"`

	// Verification token for verifying account email address.
	VerificationToken *uuid.NullUUID `db:"verification_token" format:"uuid" json:"-"`

	// The primary AuthHouseholdID, used by short links.
	PrimaryAuthHouseholdID *uuid.NullUUID `db:"primary_auth_household_id" format:"uuid" json:"primaryAuthHouseholdID"`

	// ID of the account.
	ID uuid.UUID `db:"id" format:"uuid" json:"id"`

	// Timestamp account was created.
	Created time.Time `db:"created" format:"date-time" json:"created"`

	// Timestamp of the last time the account signed in.
	LastActivity time.Time `db:"last_activity" format:"date-time" json:"lastActivity"`

	// Timestamp for when the password reset token expires.
	PasswordResetExpires time.Time `db:"password_reset_expires" json:"-"`

	// Permissions for the account when creating a new session.
	PermissionsAccount Permissions `db:"-" json:"permissionsAccount,omitempty"`

	// Permissions for the households when creating a new session.
	PermissionsHouseholds AuthHouseholdsPermissions `db:"permissions_households" json:"permissionsHouseholds"`

	// Timestamp for when account was last updated.
	Updated time.Time `db:"updated" format:"date-time" json:"updated"`

	// Preferences for the account.
	Preferences AuthAccountPreferences `db:"preferences" json:"preferences"`

	// Restricts account settings.
	Child bool `db:"child" json:"child"`

	// Prevents duplicate agenda notifications.
	DailyAgendaNotified bool `db:"daily_agenda_notified"  json:"-"`

	// Sets a longer timeout for the AuthSession.
	RememberMe bool `db:"-" json:"rememberMe,omitempty"`

	// Whether the account has gone through setup.
	Setup bool `db:"setup" json:"setup"`

	// Will check for TOTP code during sign in.
	TOTPEnabled bool `db:"totp_enabled" json:"totpEnabled"`

	// ToS must be accepted to use the app.
	ToSAccepted bool `db:"tos_accepted" json:"tosAccepted"`

	// Accounts must be verified to receive email notifications.
	Verified bool `db:"verified" json:"verified"`

	// Sets the UserAgent for the initial session after account creation.
	UserAgent types.UserAgent `db:"-" json:"userAgent"`

	// Used to determine which OIDC provider to use.
	OIDCProviderType oidc.ProviderType `db:"oidc_provider_type" json:"oidcProviderType"`

	// ISO639Code is the code used for translations.
	ISO639Code yaml8n.ISO639Code `db:"iso_639_code" json:"iso639Code"`

	// Name of the AuthAccount user.
	Name types.StringLimit `db:"name" json:"name"`

	// Code from OIDC provider to check during sign in/up.
	OIDCCode string `db:"-" json:"oidcCode"`

	// ID to lookup for performing OIDC auth.
	OIDCID string `db:"oidc_id" json:"-"`

	// Hash to compare against Password
	PasswordHash string `db:"password_hash" json:"-"`

	// PrivateKeys for decrypting secrets.
	PrivateKeys AuthAccountPrivateKeys `db:"private_keys" json:"privateKeys"`

	// PublicKey for encrypting secrets.
	PublicKey crypto.RSAPublicKey `db:"public_key" json:"publicKey"`

	// Subscription referrer when account was setup.
	SubscriptionReferrerCode string `db:"subscription_referrer_code" json:"subscriptionReferrerCode"`

	// Backup code to recover TOTP.
	TOTPBackup string `db:"totp_backup" json:"totpBackup"`

	// Code from the TOTP generator.
	TOTPCode string `db:"-" json:"totpCode"`

	// QR Code version of the TOTPSecret.
	TOTPQR string `db:"-" json:"totpQR"` //nolint: tagliatelle

	// Secret to setup a TOTP generator.
	TOTPSecret string `db:"totp_secret" json:"totpSecret"`

	// Used by notifications and UI to determine local times.
	TimeZone types.TimeZone `db:"time_zone" json:"timeZone"`

	// Primary email address of user.
	EmailAddress types.EmailAddress `db:"email_address" json:"emailAddress"`

	// Password to use for sign in/up.
	Password types.Password `db:"-" json:"password"`

	// A list of iCalendar IDs to hide.
	HideCalendarICalendars types.SliceString `db:"hide_calendar_icalendars" json:"hideCalendarICalendars"`

	// A list of IDs to collapse.
	CollapsedPlanProjects types.SliceString `db:"collapsed_plan_projects" json:"collapsedPlanProjects"`

	// A list of IDs to collapse.
	CollapsedPlanTasks types.SliceString `db:"collapsed_plan_tasks" json:"collapsedPlanTasks"`

	// A list of IDs to collapse.
	CollapsedNotesPages types.SliceString `db:"collapsed_notes_pages" json:"collapsedNotesPages"`

	// A list of WebPushClients associated with the account for notifications.
	WebPushClients notify.WebPushClients `db:"web_push_clients" json:"-"`

	// When to send the daily agenda.
	DailyAgendaTime types.CivilTime `db:"daily_agenda_time" format:"date" json:"dailyAgendaTime" swaggertype:"string"`
} // @Name AuthAccount

// AuthAccounts is multiple AuthAccount.
type AuthAccounts []AuthAccount

type authAccountAgenda struct {
	CountBudgetRecurrences int                       `db:"count_budget_recurrences"`
	CountCalendarEvents    int                       `db:"count_calendar_events"`
	CountCookMealPlans     int                       `db:"count_cook_meal_plans"`
	CountPlanTasks         int                       `db:"count_plan_tasks"`
	ID                     uuid.UUID                 `db:"id"`
	ISO639Code             yaml8n.ISO639Code         `db:"iso_639_code"`
	PermissionsHouseholds  AuthHouseholdsPermissions `db:"permissions_households"`
	TimeZone               string                    `db:"time_zone"`
}

const permissionsHouseholdsQuery = `
	, jsonb_agg(
		distinct jsonb_build_object(
			  'authHouseholdID', aaah.auth_household_id
			, 'permissions', aaah.permissions
		)
	) as permissions_households
`

const authAccountAgendaQuery = `
SELECT
	  COUNT(distinct budget_recurrence.*) AS count_budget_recurrences
	, COUNT(distinct calendar_event.*) AS count_calendar_events
	, COUNT(distinct cook_meal_plan.*) AS count_cook_meal_plans
	, COUNT(distinct plan_task.*) AS count_plan_tasks
` + permissionsHouseholdsQuery + `
	, %[1]s.id
	, %[1]s.time_zone
FROM %[1]s
LEFT JOIN auth_account_auth_household aaah ON %[1]s.id = aaah.auth_account_id
LEFT JOIN budget_recurrence ON
	(aaah.permissions->>'budget')::int < 2
	AND budget_recurrence.auth_household_id = aaah.auth_household_id
	AND (budget_recurrence.template->>'date')::date <= %[2]s
LEFT JOIN calendar_event ON
	(
		calendar_event.auth_account_id = %[1]s.id
		OR (
			(aaah.permissions->>'calendar')::int < 2
			AND calendar_event.auth_household_id = aaah.auth_household_id
			AND (
				calendar_event.participants = '{}'
				OR %[1]s.id::text=ANY(calendar_event.participants)
			)
		)
	)
	AND check_recurrence(calendar_event.date_end, calendar_event.date_start, %[2]s, calendar_event.recurrence, calendar_event.skip_days)
LEFT JOIN cook_meal_plan ON
	(aaah.permissions->>'cook')::int < 2
	AND cook_meal_plan.auth_household_id = aaah.auth_household_id
	AND (
		cook_meal_plan.auth_account_id IS NULL
		OR cook_meal_plan.auth_account_id = %[1]s.id
	)
	AND (
		(cook_meal_plan.notification_time_prep AT TIME ZONE %[1]s.time_zone)::date = %[2]s
		OR (cook_meal_plan.notification_time_cook AT TIME ZONE %[1]s.time_zone)::date = %[2]s
		OR cook_meal_plan.date = %[2]s
	)
LEFT JOIN plan_task ON
	(
		plan_task.auth_account_id = %[1]s.id
		OR (
			(aaah.permissions->>'plan')::int < 2
			AND plan_task.auth_household_id = aaah.auth_household_id
			AND plan_task.auth_account_id IS NULL
		)
	)
	AND NOT plan_task.done
	AND plan_task.due_date IS NOT NULL
	AND (plan_task.due_date AT TIME ZONE %[1]s.time_zone)::date <= %[2]s
%[3]s
GROUP BY
	  %[1]s.id
	, %[1]s.time_zone
	
`

func (a authAccountAgenda) BodyNothing() string {
	return yaml8n.PushDailyAgendaBodyNothing.Translate(a.ISO639Code)
}

func (a authAccountAgenda) Event() string {
	return yaml8n.ObjectEvent.Translate(a.ISO639Code)
}

func (a authAccountAgenda) Events() string {
	return yaml8n.ObjectEvents.Translate(a.ISO639Code)
}

func (a authAccountAgenda) Empty() bool {
	return a.CountBudgetRecurrences == 0 && a.CountCalendarEvents == 0 && a.CountCookMealPlans == 0 && a.CountPlanTasks == 0
}

func (a authAccountAgenda) MealPlan() string {
	return yaml8n.ObjectMealPlan.Translate(a.ISO639Code)
}

func (a authAccountAgenda) MealPlans() string {
	return yaml8n.ObjectMealPlans.Translate(a.ISO639Code)
}

func (a authAccountAgenda) RecurringTransaction() string {
	return yaml8n.ObjectRecurringTransaction.Translate(a.ISO639Code)
}

func (a authAccountAgenda) RecurringTransactions() string {
	return yaml8n.ObjectRecurringTransactions.Translate(a.ISO639Code)
}

func (a authAccountAgenda) Task() string {
	return yaml8n.ObjectTask.Translate(a.ISO639Code)
}

func (a authAccountAgenda) Tasks() string {
	return yaml8n.ObjectTasks.Translate(a.ISO639Code)
}

// AuthAccountNotifyType is the various things Homechart can notify.
type AuthAccountNotifyType int

// AuthAccountNotifyType is the various things Homechart can notify.
const (
	AuthAccountNotifyTypeAgenda AuthAccountNotifyType = iota
	AuthAccountNotifyTypeEventHousehold
	AuthAccountNotifyTypeEventPersonal
	AuthAccountNotifyTypeMealPlanCook
	AuthAccountNotifyTypeMealPlanPrep
	AuthAccountNotifyTypeNewsletter
	AuthAccountNotifyTypeTaskComplete
	AuthAccountNotifyTypeTaskHousehold
	AuthAccountNotifyTypeTaskPersonal
	AuthAccountNotifyTypeSystem
)

func (a AuthAccountNotifyType) isPermitted(authHouseholdID *uuid.UUID, authHouseholdsPermissions AuthHouseholdsPermissions) bool {
	ah := authHouseholdsPermissions.Get(authHouseholdID)

	switch a {
	case AuthAccountNotifyTypeEventHousehold:
		return ah != nil && ah.IsPermitted(PermissionComponentCalendar, PermissionView, false)
	case AuthAccountNotifyTypeMealPlanCook:
		fallthrough
	case AuthAccountNotifyTypeMealPlanPrep:
		return ah != nil && ah.IsPermitted(PermissionComponentCook, PermissionView, false)
	case AuthAccountNotifyTypeAgenda:
		fallthrough
	case AuthAccountNotifyTypeEventPersonal:
		fallthrough
	case AuthAccountNotifyTypeNewsletter:
		fallthrough
	case AuthAccountNotifyTypeTaskPersonal:
		fallthrough
	case AuthAccountNotifyTypeSystem:
		return true
	case AuthAccountNotifyTypeTaskComplete:
		fallthrough
	case AuthAccountNotifyTypeTaskHousehold:
		return ah != nil && ah.IsPermitted(PermissionComponentPlan, PermissionView, false)
	}

	return false
}

// AuthAccountReadAgendaAssistant reads an agenda for an assistant and returns a text prompt.
func AuthAccountReadAgendaAssistant(ctx context.Context, authAccountID *uuid.UUID, date types.CivilDate, dateOriginal string) string {
	ctx = logger.Trace(ctx)

	var a authAccountAgenda

	err := db.Query(ctx, false, &a, fmt.Sprintf(authAccountAgendaQuery, "auth_account", "$2", `
WHERE
	auth_account.id = $1
`), nil, authAccountID, date)
	if err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return fmt.Sprintf("Sorry, I couldn't find your agenda for %s, please try again later.", getDateOriginal(dateOriginal, false))
	}

	speechParts := []string{}

	createSpeech := func(count int, name string) string {
		speech := strconv.Itoa(count) + " " + name

		if count > 1 {
			speech += "s"
		}

		return speech
	}

	if a.CountBudgetRecurrences > 0 {
		speechParts = append(speechParts, createSpeech(a.CountBudgetRecurrences, "recurring transaction"))
	}

	if a.CountCalendarEvents > 0 {
		speechParts = append(speechParts, createSpeech(a.CountCalendarEvents, "event"))
	}

	if a.CountCookMealPlans > 0 {
		speechParts = append(speechParts, createSpeech(a.CountCookMealPlans, "meal"))
	}

	if a.CountPlanTasks > 0 {
		speechParts = append(speechParts, createSpeech(a.CountPlanTasks, "task"))
	}

	if len(speechParts) == 0 {
		logger.Log(ctx, err) //nolint:errcheck

		return "You have nothing scheduled for " + getDateOriginal(dateOriginal, false)
	}

	logger.Log(ctx, err) //nolint:errcheck

	return fmt.Sprintf("You have %s scheduled for %s.", ToList(speechParts), getDateOriginal(dateOriginal, false))
}

// AuthAccountsRead returns all AuthAccounts in a database.
func AuthAccountsRead(ctx context.Context, emailAddressFilter types.EmailAddress, idFilter uuid.UUID, offset int) (AuthAccounts, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get AuthAccounts
	a := AuthAccounts{}

	var err errs.Err

	var total int

	query := `
SELECT
	  auth_account.created
	, auth_account.email_address
	, auth_account.id
	, last_activity
	, oidc_provider_type
	, primary_auth_household_id
	, verified
	, auth_account.updated
FROM auth_account
LEFT JOIN auth_account_auth_household aaah ON aaah.auth_account_id = auth_account.id
`

	if idFilter != uuid.Nil {
		err = db.Query(ctx, true, &a, query+`
WHERE auth_account.id = $1
OR aaah.auth_household_id = $1
GROUP BY auth_account.id
`, nil, idFilter)
		total = len(a)
	} else {
		if err = db.Query(ctx, true, &a, query+`
WHERE auth_account.email_address LIKE '%' || $1 || '%'
GROUP BY auth_account.id
ORDER BY created
LIMIT 50
OFFSET $2
`, nil, emailAddressFilter, offset); err != nil {
			return a, total, logger.Log(ctx, err)
		}

		err = db.Query(ctx, false, &total, "SELECT COUNT(id) FROM auth_account WHERE email_address LIKE '%' || $1 || '%'", nil, emailAddressFilter)
	}

	return a, total, logger.Log(ctx, err)
}

// AuthAccountsReadAgendaNotify generates an agenda notification.
func AuthAccountsReadAgendaNotify(ctx context.Context) (Notifications, errs.Err) {
	ctx = logger.Trace(ctx)

	a := []authAccountAgenda{}
	ns := Notifications{}

	if err := db.Query(ctx, true, &a, `
WITH auth_accounts AS (
	UPDATE auth_account
	SET daily_agenda_notified = TRUE
	WHERE DATE_TRUNC('minute', auth_account.daily_agenda_next) <= DATE_TRUNC('minute', now())
	RETURNING
		  auth_account.id
		, auth_account.iso_639_code
		, auth_account.time_zone
)
`+fmt.Sprintf(authAccountAgendaQuery, "auth_accounts", "(now() at TIME ZONE auth_accounts.time_zone)::date", ""), nil); err != nil {
		return ns, logger.Log(ctx, err)
	}

	t := template.Must(template.New("body").Parse(templates.DailyAgendaBody))

	for i := range a {
		location, err := time.LoadLocation(a[i].TimeZone)
		if err != nil {
			location = time.UTC
		}

		now := time.Now().In(location)

		var body bytes.Buffer

		if err := t.Execute(&body, a[i]); err != nil {
			return ns, logger.Log(ctx, errs.NewServerErr(err))
		}

		n := AuthAccountsReadNotifications(ctx, &a[i].ID, nil, AuthAccountNotifyTypeAgenda)

		if len(n) == 1 {
			n[0].Actions.Default = "/calendar"
			n[0].BodySMTP = fmt.Sprintf("%s:\n\n%s\n[%s](%s/calendar)", yaml8n.EmailDailyAgendaHeader.Translate(a[i].ISO639Code), regexp.MustCompile(`(\d+)`).ReplaceAllString(body.String(), "- ${1}"), yaml8n.EmailDailyAgendaViewCalendar.Translate(a[i].ISO639Code), c.App.BaseURL)
			n[0].BodyWebPush = body.String() + "\nPress here to view your calendar"
			n[0].SubjectSMTP = templates.PushDailyAgendaSubject(a[i].ISO639Code, now.Format("Monday, January 2, 2006"))
			n[0].SubjectWebPush = templates.PushDailyAgendaSubject(a[i].ISO639Code, now.Format("Monday, January 2, 2006"))
			ns = append(ns, n[0])
		}
	}

	return ns, logger.Log(ctx, nil)
}

// AuthAccountsReadNotifications queries a database for accounts returns notifications.
func AuthAccountsReadNotifications(ctx context.Context, authAccountID *uuid.UUID, authHouseholdID *uuid.UUID, t AuthAccountNotifyType) Notifications { //nolint: gocognit
	/*
		This isn't as complicated as it seems
		- Get key from cache if it exists (hopefully it does!)
		- If doesn't exist, query _all_ auth accounts that match the AuthAccountID, AuthHouseholdID, or none (newsletter!)
		- Cache those values for next time
		- Iterate over each auth account in what was returned
		- If the account doesn't ignore the notification type and has permission, add the respective address (email/token) to recipients
	*/
	ctx = logger.Trace(ctx)

	var err errs.Err

	aa := AuthAccounts{}
	query := true
	cache := Cache{
		AuthAccountID:   authAccountID,
		AuthHouseholdID: authHouseholdID,
		TableName:       "auth_account_notify",
		Value:           &aa,
	}

	ns := Notifications{}

	if (authAccountID != nil || authHouseholdID != nil) && t != AuthAccountNotifyTypeNewsletter {
		if err := cache.Get(ctx); err == nil {
			query = false
		}
	}

	if query {
		query := `
SELECT
	  auth_account.email_address
	, auth_account.child
	, auth_account.id
	, auth_account.iso_639_code
	, auth_account.preferences
	, auth_account.verified
` + permissionsHouseholdsQuery + `
	, JSONB_AGG(DISTINCT auth_session.web_push) FILTER (where auth_session.web_push IS NOT NULL) AS web_push_clients
FROM auth_account
LEFT JOIN auth_account_auth_household aaah ON aaah.auth_account_id = auth_account.id
LEFT JOIN auth_session
ON auth_account.id = auth_session.auth_account_id
`

		switch {
		case authAccountID != nil && authHouseholdID == nil:
			query += "WHERE auth_account.id = $1 GROUP BY auth_account.id ORDER BY auth_account.created"
			err = db.Query(ctx, true, &aa, query, nil, authAccountID)
		case authHouseholdID != nil:
			query += "WHERE aaah.auth_household_id = $1 GROUP BY auth_account.id ORDER BY auth_account.created"
			err = db.Query(ctx, true, &aa, query, nil, authHouseholdID)
		case t == AuthAccountNotifyTypeNewsletter || t == AuthAccountNotifyTypeSystem:
			query += "GROUP BY auth_account.id ORDER BY auth_account.created"
			err = db.Query(ctx, true, &aa, query, nil)
		default:
			logger.Log(ctx, errs.NewServerErr(errors.New("attempted to send an email to everyone that wasn't a newsletter or system")), fmt.Sprintf("type: %d", t)) //nolint:errcheck

			return ns
		}

		if err != nil && (authAccountID != nil || authHouseholdID != nil) && t != AuthAccountNotifyTypeNewsletter {
			err := cache.Set(ctx)
			logger.Log(ctx, err) //nolint:errcheck
		}
	}

	for i := range aa {
		if aa[i].Child || !t.isPermitted(authHouseholdID, aa[i].PermissionsHouseholds) || (t == AuthAccountNotifyTypeTaskComplete && authAccountID != nil && aa[i].ID == *authAccountID) {
			continue
		}

		n := Notification{
			AuthAccountID: &aa[i].ID,
			ISO639Code:    aa[i].ISO639Code,
			Preferences:   aa[i].Preferences,
		}

		smtp, webpush := aa[i].getRecipients(authHouseholdID, t)

		if len(webpush) > 0 {
			n.ToWebPush = webpush
		}

		if smtp != "" && (t == AuthAccountNotifyTypeSystem || aa[i].Verified) {
			n.ToSMTP = smtp
		}

		if len(n.ToWebPush) != 0 || n.ToSMTP != "" {
			ns = append(ns, n)
		}
	}

	logger.Log(ctx, nil) //nolint:errcheck

	return ns
}

// Create adds an AuthAccount to a database.
func (a *AuthAccount) Create(ctx context.Context, restore bool) errs.Err {
	ctx = logger.Trace(ctx)

	if a.Child {
		a.EmailAddress = types.EmailAddress(GenerateUUID().String() + "@" + "example.com")
		a.Password = types.Password(GenerateUUID().String())
		a.Verified = true
	}

	if !restore {
		// Hash the password
		if err := a.GeneratePasswordHash(ctx); err != nil {
			return logger.Log(ctx, err)
		}
	}

	a.ID = GenerateUUID()

	if a.ISO639Code == "" {
		a.ISO639Code = "en"
	}

	if a.Name == "" {
		a.Name = "Homecharter"
	}

	if a.TimeZone == "" {
		a.TimeZone = "UTC"
	}

	if a.Verified {
		a.VerificationToken = nil
	}

	if !a.Verified {
		vt := GenerateUUID()
		a.Preferences.IgnoreEmailCalendarEvent = true
		a.Preferences.IgnoreEmailPlanTask = true
		a.VerificationToken = types.UUIDToNullUUID(vt)
	}

	if a.LastActivity.IsZero() {
		a.LastActivity = GenerateTimestamp()
	}

	// Add to database
	return logger.Log(ctx, db.Query(ctx, false, a, `
INSERT INTO auth_account (
	  child
	, daily_agenda_next
	, daily_agenda_time
	, email_address
	, id
	, iso_639_code
	, last_activity
	, name
	, oidc_id
	, oidc_provider_type
	, password_hash
	, preferences
	, private_keys
	, public_key
	, setup
	, subscription_referrer_code
	, time_zone
	, tos_accepted
	, verification_token
	, verified
) VALUES (
	  :child
	, :daily_agenda_next
	, :daily_agenda_time
	, :email_address
	, :id
	, :iso_639_code
	, :last_activity
	, :name
	, :oidc_id
	, :oidc_provider_type
	, :password_hash
	, :preferences
	, :private_keys
	, :public_key
	, :setup
	, :subscription_referrer_code
	, :time_zone
	, :tos_accepted
	, :verification_token
	, :verified
)
RETURNING *
`, a))
}

// CreateTOTP generates an AuthAccountTOTP key.
func (a *AuthAccount) CreateTOTP(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Homechart",
		AccountName: a.EmailAddress.String(),
	})

	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	a.TOTPSecret = key.Secret()

	img, err := key.Image(200, 200)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	var buf bytes.Buffer

	err = png.Encode(&buf, img)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	a.TOTPQR = base64.StdEncoding.EncodeToString(buf.Bytes())

	return logger.Log(ctx, nil)
}

// Delete deletes an AuthAccount database record.
func (a *AuthAccount) Delete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Delete account
	return logger.Log(ctx, db.Exec(ctx, "DELETE FROM auth_account WHERE id = :id", a))
}

// GeneratePasswordHash creates a password hash.
func (a *AuthAccount) GeneratePasswordHash(ctx context.Context) errs.Err {
	var err errs.Err

	a.PasswordHash, err = a.Password.Hash(nil)

	return logger.Log(ctx, err)
}

// Read queries a database for an AuthAccount using an ID.
func (a *AuthAccount) Read(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	var ac AuthAccount

	cache := Cache{
		ID:        &a.ID,
		TableName: "auth_account",
		Value:     &ac,
	}

	if err := cache.Get(ctx); err == nil {
		if ac.Updated.Equal(a.Updated) {
			err = errs.ErrClientNoContent
		} else {
			*a = ac
		}

		return logger.Log(ctx, err)
	}

	// Make sure a password is never accidentally leaked into cache
	a.Password = ""

	// Update LastActivity
	a.LastActivity = GenerateTimestamp()

	if err := db.Query(ctx, false, a, "UPDATE auth_account SET last_activity = :last_activity WHERE id = :id AND last_activity::::date IS DISTINCT FROM (:last_activity)::::date", a); err != nil && !errors.Is(err, errs.ErrClientNoContent) {
		return logger.Log(ctx, err)
	}

	query := `
SELECT *
FROM auth_account
WHERE id = :id
`

	if !a.Updated.IsZero() {
		query += "AND updated > :updated"
	}

	// Get details
	err := db.Query(ctx, false, a, query, a)
	if err == nil {
		cache.Value = &a
		if err := cache.Set(ctx); err != nil {
			logger.Log(ctx, err) //nolint:errcheck
		}
	}

	return logger.Log(ctx, err)
}

// ReadOIDCID queries a database for an AuthAccount using an OIDC ID.
func (a *AuthAccount) ReadOIDCID(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get details
	return logger.Log(ctx, db.Query(ctx, false, a, `
SELECT
	id
FROM auth_account
WHERE oidc_provider_type = :oidc_provider_type
AND oidc_id = :oidc_id
`, a))
}

// ReadPasswordHash queries a database for an AuthAccount using an ID or EmailAddress.
func (a *AuthAccount) ReadPasswordHash(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get details
	return logger.Log(ctx, db.Query(ctx, false, a, `
SELECT
	  child
	, id
	, password_hash
	, tos_accepted
	, totp_backup
	, totp_secret
FROM auth_account
WHERE email_address = :email_address
OR id = :id
`, a))
}

// ReadPasswordReset queries a database for an AuthAccount PasswordReset data using an email_address.
func (a *AuthAccount) ReadPasswordReset(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Get details
	return logger.Log(ctx, db.Query(ctx, false, a, `
SELECT
	  id
	, iso_639_code
	, password_reset_expires
	, password_reset_token
	, verified
FROM auth_account
WHERE email_address = $1
`, nil, a.EmailAddress))
}

// ReadTOTPBackup reads an AuthAccount.TOTPBackup using an ID.
func (a *AuthAccount) ReadTOTPBackup(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, "SELECT email_address, totp_backup FROM auth_account WHERE id = :id", a))
}

// Update updates an AuthAccount database record.
func (a *AuthAccount) Update(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	if a.Verified {
		a.VerificationToken = nil
	}

	if !a.Verified && a.VerificationToken == nil {
		vt := GenerateUUID()
		a.VerificationToken = types.UUIDToNullUUID(vt)
	}

	a.Preferences.NotificationsHouseholds.Sanitize(ctx, a.ID)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  collapsed_notes_pages = :collapsed_notes_pages
	, collapsed_plan_projects = :collapsed_plan_projects
	, collapsed_plan_tasks = :collapsed_plan_tasks
	, daily_agenda_next = :daily_agenda_next
	, daily_agenda_time = :daily_agenda_time
	, email_address = :email_address
	, hide_calendar_icalendars = :hide_calendar_icalendars
	, iso_639_code = :iso_639_code
	, name = :name
	, preferences = :preferences
	, primary_auth_household_id = :primary_auth_household_id
	, setup = :setup
	, time_zone = :time_zone
	, verification_token = :verification_token
	, verified = :verified
WHERE id = :id
RETURNING *
`, a))
}

// UpdateICalendarID updates an AuthAccount ICalendarID.
func (a *AuthAccount) UpdateICalendarID(ctx context.Context, remove bool) errs.Err {
	ctx = logger.Trace(ctx)

	if remove {
		a.ICalendarID = nil
	} else {
		a.ICalendarID = types.UUIDToNullUUID(GenerateUUID())
	}

	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  icalendar_id = :icalendar_id
WHERE id = :id
RETURNING *
`, a))
}

// UpdateOIDC updates an AuthAccount OIDC setting.
func (a *AuthAccount) UpdateOIDC(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  oidc_id = :oidc_id
	, oidc_provider_type = :oidc_provider_type
WHERE id = :id
RETURNING *
`, a))
}

// UpdatePasswordHash updates an AuthAccount PasswordHash using an ID.
func (a *AuthAccount) UpdatePasswordHash(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Hash the password
	if err := a.GeneratePasswordHash(ctx); err != nil {
		return logger.Log(ctx, err)
	}

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET password_hash = :password_hash
WHERE id = :id
RETURNING *
`, a))
}

// UpdatePasswordReset updates an AuthAccount PasswordReset data using an email address.
func (a *AuthAccount) UpdatePasswordReset(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  password_reset_expires = :password_reset_expires
	, password_reset_token = :password_reset_token
	, verified = :verified
WHERE email_address = :email_address
RETURNING *
`, a))
}

// UpdatePrivatePublicKeys updates an AuthAccount Private/Public Keys using an ID.
func (a *AuthAccount) UpdatePrivatePublicKeys(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	if len(a.PrivateKeys) == 0 || a.PublicKey == "" {
		a.PrivateKeys = nil
		a.PublicKey = ""
	}

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  private_keys = :private_keys
	, public_key = :public_key
WHERE id = :id
RETURNING *
`, a))
}

// UpdateTOTP updates an AuthAccount TOTP using an ID.
func (a *AuthAccount) UpdateTOTP(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Set fields
	if a.TOTPSecret != "" && !totp.Validate(a.TOTPCode, a.TOTPSecret) {
		return logger.Log(ctx, ErrClientBadRequestTOTP)
	}

	seed, err := rand.Int(rand.Reader, big.NewInt(899999))
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	if a.TOTPSecret != "" {
		a.TOTPBackup = strconv.Itoa(int(int64(100000) + seed.Int64()))
		a.TOTPEnabled = true
	} else {
		a.TOTPBackup = ""
		a.TOTPEnabled = false
	}

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  totp_backup = :totp_backup
	, totp_enabled = :totp_enabled
	, totp_secret = :totp_secret
WHERE
	id = :id
	AND child = false
RETURNING *
`, a))
}

// UpdateVerification updates an AuthAccount Verification using an ID.
func (a *AuthAccount) UpdateVerification(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	if a.Verified {
		a.VerificationToken = nil
	}

	if !a.Verified {
		vt := GenerateUUID()
		a.VerificationToken = types.UUIDToNullUUID(vt)
	}

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_account
SET
	  verification_token = :verification_token
	, verified = :verified
WHERE id = :id
RETURNING *
`, a))
}

func (a *AuthAccount) getRecipients(authHouseholdID *uuid.UUID, t AuthAccountNotifyType) (smtp string, webPush notify.WebPushClients) { //nolint:gocognit
	ah := a.Preferences.NotificationsHouseholds.Get(authHouseholdID)

	switch t {
	case AuthAccountNotifyTypeAgenda:
		if !a.Preferences.IgnoreDeviceAgenda {
			webPush = a.WebPushClients
		}

		if !a.Preferences.IgnoreEmailAgenda {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeEventHousehold:
		if !ah.IgnoreDeviceCalendarEvent {
			webPush = a.WebPushClients
		}

		if !ah.IgnoreEmailCalendarEvent {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeEventPersonal:
		if !a.Preferences.IgnoreDeviceCalendarEvent {
			webPush = a.WebPushClients
		}

		if !a.Preferences.IgnoreEmailCalendarEvent {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeMealPlanCook:
		if !ah.IgnoreDeviceCookMealPlanCook {
			webPush = a.WebPushClients
		}

		if !ah.IgnoreEmailCookMealPlanCook {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeMealPlanPrep:
		if !ah.IgnoreDeviceCookMealPlanPrep {
			webPush = a.WebPushClients
		}

		if !ah.IgnoreEmailCookMealPlanPrep {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeNewsletter:
		if !a.Preferences.IgnoreEmailNewsletter {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeTaskComplete:
		if !ah.IgnoreDevicePlanTaskComplete {
			webPush = a.WebPushClients
		}
	case AuthAccountNotifyTypeTaskHousehold:
		if !ah.IgnoreDevicePlanTask {
			webPush = a.WebPushClients
		}

		if !ah.IgnoreEmailPlanTask {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeTaskPersonal:
		if !a.Preferences.IgnoreDevicePlanTask {
			webPush = a.WebPushClients
		}

		if !a.Preferences.IgnoreEmailPlanTask {
			smtp = a.EmailAddress.String()
		}
	case AuthAccountNotifyTypeSystem:
		webPush = a.WebPushClients
		smtp = a.EmailAddress.String()
	}

	if a.Child {
		smtp = ""
	}

	return smtp, webPush
}

// AuthAccountsDeleteInactive deletes inactive AuthAccounts.
func AuthAccountsDeleteInactive(ctx context.Context) {
	ctx = logger.Trace(ctx)

	// Delete accounts
	//nolint:errcheck
	logger.Log(ctx, db.Exec(ctx, fmt.Sprintf(`
DELETE FROM auth_account
WHERE last_activity < now() - interval '%d days'
AND NOT EXISTS (
	SELECT 1
	FROM auth_account_auth_household
	WHERE auth_account_auth_household.auth_account_id = auth_account.id
)
`, c.App.KeepInactiveAuthAccountDays), nil))
}
