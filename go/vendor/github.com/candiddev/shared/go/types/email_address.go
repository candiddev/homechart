package types

import (
	"database/sql/driver"
	"errors"
	"regexp"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
)

var ErrEmailAddress = errs.ErrSenderBadRequest.Set("Email address format should match something@example.com")

// EmailAddress is a valid email address.
type EmailAddress string

// String returns an EmailAddress string.
func (e EmailAddress) String() string {
	return strings.ToLower(string(e))
}

// MarshalJSON converts an email address to a string.
func (e EmailAddress) MarshalJSON() ([]byte, error) {
	q := strconv.Quote(e.String())

	return []byte(q), nil
}

// UnmarshalJSON returns a valid Email Address struct key.
func (e *EmailAddress) UnmarshalJSON(data []byte) error {
	v, err := strconv.Unquote(string(data))
	if err != nil {
		return ErrEmailAddress.Wrap(err)
	}

	v = strings.ToLower(v)
	if regexp.MustCompile(`^\S+\@\S+$`).MatchString(v) {
		*e = EmailAddress(v)

		return nil
	}

	return ErrEmailAddress.Wrap(errors.New("regexp didn't match"))
}

// Value returns a string representation of Email.
func (e EmailAddress) Value() (driver.Value, error) {
	return e.String(), nil
}

// Scan reads an interface into Email Address.
func (e *EmailAddress) Scan(src any) error {
	if src.(string) != "" {
		*e = EmailAddress(strings.ToLower(src.(string)))
	}

	return nil
}
