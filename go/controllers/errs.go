package controllers

import (
	"errors"

	"github.com/candiddev/shared/go/errs"
)

var errClientBadRequestAuthAccountMissing = errs.ErrSenderBadRequest.Set("Account does not exist")
var errClientBadRequestOAuth = errs.ErrSenderBadRequest.Set("Unable to parse OAuth header")
var errClientBadRequestPassword = errs.ErrSenderBadRequest.Set("Incorrect password")
var errClientBadRequestSignupDisabled = errs.ErrSenderBadRequest.Set("Sorry, new account signup is currently disabled")
var errClientBadRequestToSAccepted = errs.ErrSenderBadRequest.Set("Terms of Service not accepted, please accept Terms of Service")
var errClientBadRequestSSEUnsupported = errs.ErrSenderBadRequest.Set("Event stream is unsupported")

var errConflictAuthAccount = errs.ErrSenderConflict.Set("Account already exists")

var errServerDuplicateWebhook = errs.ErrReceiver.Wrap(errors.New("duplicate webhook received"))
var errServerProxyURL = errs.ErrReceiver.Wrap(errors.New("unable to proxy URL to self hosted instance"))
var errServerWebhook = errs.ErrReceiver.Wrap(errors.New("unable to read webhook request"))

const (
	noticeAuthAccountCreated      = "AuthAccount created: "
	noticeAuthAccountDeleted      = "AuthAccount deleted: "
	noticeAuthAccountReset        = "AuthAccount reset: "
	noticeAuthHouseholdDeleted    = "AuthHousehold deleted: "
	noticeAuthHouseholdSubscribed = "AuthHousehold subscribed: "
	noticeRateLimited             = "RemoteAddr rate limited: "
)
