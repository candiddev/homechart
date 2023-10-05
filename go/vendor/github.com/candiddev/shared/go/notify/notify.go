// Package notify contains helper functions for sending notifications.
package notify

import (
	"errors"

	"github.com/candiddev/shared/go/errs"
)

var ErrCancelled = errors.New("invalid config")
var ErrMissing = errors.New("client not found")

// ErrSend means a send request failed.
var ErrSend = errors.New("error sending notification")

// NewErrCancelled creates an error with a cancellation reason.
func NewErrCancelled(reason string) errs.Err {
	return errs.ErrSenderBadRequest.Set("Notification cancelled").Wrap(ErrCancelled, errors.New(reason))
}
