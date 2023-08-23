package controllers

import (
	"errors"

	"github.com/candiddev/shared/go/errs"
)

var errClientBadRequestAuthAccountMissing = errs.NewClientBadRequestErr("Account does not exist")
var errClientBadRequestOAuth = errs.NewClientBadRequestErr("Unable to parse OAuth header")
var errClientBadRequestPassword = errs.NewClientBadRequestErr("Incorrect password")
var errClientBadRequestSignupDisabled = errs.NewClientBadRequestErr("Sorry, new account signup is currently disabled")
var errClientBadRequestToSAccepted = errs.NewClientBadRequestErr("Terms of Service not accepted, please accept Terms of Service")
var errClientBadRequestSSEUnsupported = errs.NewClientBadRequestErr("Event stream is unsupported")

var errConflictAuthAccount = errs.NewConflictErr("Account already exists")

var errServerDuplicateWebhook = errs.NewServerErr(errors.New("duplicate webhook received"))
var errServerProxyURL = errs.NewServerErr(errors.New("unable to proxy URL to self hosted instance"))
var errServerWebhook = errs.NewServerErr(errors.New("unable to read webhook request"))

const (
	noticeAuthAccountCreated      = "AuthAccount created: "
	noticeAuthAccountDeleted      = "AuthAccount deleted: "
	noticeAuthAccountReset        = "AuthAccount reset: "
	noticeAuthHouseholdDeleted    = "AuthHousehold deleted: "
	noticeAuthHouseholdSubscribed = "AuthHousehold subscribed: "
	noticeRateLimited             = "RemoteAddr rate limited: "
)
