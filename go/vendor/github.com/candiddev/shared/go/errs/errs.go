// Package errs contains custom functions for managing errors.
package errs

import (
	"fmt"
	"net/http"
	"strings"
)

// Err is a custom interface for Errs.
type Err interface {
	Error() string
	Errors() []error
	Is(err error) bool
	Like(err Err) bool
	Logged() bool
	Message() string
	Set(message string) Err
	Status() int
	Wrap(err ...error) Err
}

// err is a struct containing errors.
type err struct {
	errors  []error
	logged  bool
	message string
	status  int
}

// Error returns the actual error message for logging.
func (e *err) Error() string {
	if len(e.errors) == 0 {
		return ""
	}

	out := []string{}

	for i := range e.errors {
		out = append(out, strings.TrimSpace(fmt.Sprint(e.errors[i])))
	}

	return strings.Join(out, ": ")
}

// Errors returns a list of all errors.
func (e *err) Errors() []error {
	return e.errors
}

// Is returns whether the error contains another error.
func (e *err) Is(target error) bool {
	if t, ok := target.(*err); ok {
		if len(t.errors) == 0 {
			return e.Like(t)
		} else if len(e.errors) == 0 {
			return t.Like(e)
		}

		return strings.Contains(e.Error(), t.Error())
	}

	for i := range e.errors {
		if e.errors[i] == target {
			return true
		}
	}

	return false
}

// Like returns whether an Err is similar to another Err by comparing their status.
func (e *err) Like(target Err) bool {
	return e.Status() == target.Status()
}

// Logged tracks whether an error has already been logged to avoid repeated logs.
func (e *err) Logged() bool {
	if e.logged {
		return true
	}

	e.logged = true

	return false
}

// Message returns the message of an err.
func (e *err) Message() string {
	return e.message
}

// Set replaces the message of an err.
func (e *err) Set(message string) Err {
	er := *e
	er.message = message

	return &er
}

// Status returns a status for a client.
func (e *err) Status() int {
	return e.status
}

// Wrap adds an error to the error list or replaces the message.
func (e *err) Wrap(targets ...error) Err {
	er := *e
	if len(targets) > 0 {
		er.errors = append(er.errors, targets...)
	}

	return &er
}

// Base Err types.
var (
	ErrReceiver              = newErr(http.StatusInternalServerError, "Server error, try again later")
	ErrSenderBadRequest      = newErr(http.StatusBadRequest, "Error processing request")
	ErrSenderConflict        = newErr(http.StatusConflict, "Item already exists")
	ErrSenderForbidden       = newErr(http.StatusForbidden, "Action forbidden")
	ErrSenderNoContent       = newErr(http.StatusNoContent, "")
	ErrSenderNotFound        = newErr(http.StatusNotFound, "Item not found")
	ErrSenderPaymentRequired = newErr(http.StatusPaymentRequired, "Your subscription has expired, please renew your subscription")
	ErrSenderTooManyRequest  = newErr(http.StatusTooManyRequests, "Too many requests, please try again later")
	ErrSenderUnauthorized    = newErr(http.StatusUnauthorized, "Please sign in")
)

func newErr(status int, message string) Err {
	return &err{
		message: message,
		status:  status,
	}
}
