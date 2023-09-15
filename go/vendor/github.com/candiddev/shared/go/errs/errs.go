// Package errs contains custom functions for managing errors.
package errs

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
)

// Err is a custom interface for Errs.
type Err interface {
	Append(err error) Err
	Error() string
	Is(err error) bool
	Message() string
	Status() int
}

// err is a struct containing client or server errors.
type err struct {
	errors  []error
	message string
	status  int
}

// Append adds an error to an Err.
func (e *err) Append(err error) Err {
	ne := *e
	ne.errors = append(ne.errors, err)

	return &ne
}

// Error returns the actual error message for logging.
func (e *err) Error() string {
	if e.errors == nil {
		return ""
	}

	s := []string{}
	for i := range e.errors {
		s = append(s, fmt.Sprint(e.errors[i]))
	}

	return strings.Join(s, ": ")
}

// Is returns whether the error contains another error.
func (e *err) Is(err error) bool {
	for i := range e.errors {
		if e.errors[i] == err || errors.Is(err, e.errors[i]) {
			return true
		}
	}

	return false
}

// Message returns a message for a client.
func (e *err) Message() string {
	return e.message
}

// Status returns a status for a client.
func (e *err) Status() int {
	return e.status
}

// Err equivalents for HTTP status codes.
const (
	ErrStatusBadRequest          = http.StatusBadRequest
	ErrStatusCLI                 = http.StatusTeapot
	ErrStatusConflict            = http.StatusConflict
	ErrStatusForbidden           = http.StatusForbidden
	ErrStatusGone                = http.StatusGone
	ErrStatusInternalServerError = http.StatusInternalServerError
	ErrStatusNoContent           = http.StatusNoContent
	ErrStatusPaymentRequired     = http.StatusPaymentRequired
	ErrStatusTooManyRequests     = http.StatusTooManyRequests
	ErrStatusUI                  = http.StatusNotAcceptable
)

// ErrClientPaymentRequired means a subscription is missing or no longer valid.
var ErrClientPaymentRequired = newErr(ErrStatusPaymentRequired, "Your subscription has expired, please renew your subscription", errors.New("payment required"))

// ErrClientForbidden means an action cannot be performed by the client.
var ErrClientForbidden = newErr(ErrStatusForbidden,
	"Action forbidden", errors.New("action forbidden"))

// ErrClientGone means a client doesn't have a session.
var ErrClientGone = newErr(ErrStatusGone, "Please sign in", errors.New("gone"))

// ErrClientNoContent means there is no data to return to the client.
var ErrClientNoContent = newErr(ErrStatusNoContent, "", errors.New("no content"))

// ErrClientTooManyRequests means a client is rate limited.
var ErrClientTooManyRequests = newErr(ErrStatusTooManyRequests, "Too many requests, please try again later", errors.New("too many requests"))

// ErrUI is an error received from the UI.
var ErrUI = newErr(ErrStatusUI, "", errors.New("ui error"))

var ErrClientConflictExists = NewConflictErr("Item already exists")

var ErrClientBadRequestMissing = NewClientBadRequestErr("Item not found")

var ErrClientBadRequestProperty = NewClientBadRequestErr("Error processing this request")

func newErr(status int, message string, errs ...error) Err {
	if len(errs) == 0 {
		return nil
	}

	return &err{
		errors:  errs,
		message: message,
		status:  status,
	}
}

// NewClientBadRequestErr creates errors for any kind of bad request from a client and should include a message on how to fix the error.
func NewClientBadRequestErr(message string, errs ...error) Err {
	if errs == nil {
		errs = []error{
			errors.New(strings.ToLower(message)),
		}
	}

	return newErr(ErrStatusBadRequest, message, errs...)
}

// NewConflictErr creates errors for conflicts.
func NewConflictErr(message string, errs ...error) Err {
	if errs == nil {
		errs = []error{
			errors.New(strings.ToLower(message)),
		}
	}

	return newErr(ErrStatusConflict, message, errs...)
}

// NewCLIErr creates errors for any kind of CLI issue.
func NewCLIErr(errs ...error) Err {
	return newErr(ErrStatusCLI, "", errs...)
}

// MsgServerErr is a sentinel messasge for server errors.
const MsgServerErr = "Server error, try again later"

// NewServerErr creates errors for any kind of server issue.
func NewServerErr(errs ...error) Err {
	return newErr(ErrStatusInternalServerError, MsgServerErr, errs...)
}
