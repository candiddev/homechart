package types

import (
	"database/sql/driver"
	"strconv"
	"time"

	"github.com/candiddev/shared/go/errs"
)

// TimeZone is a user or calendar TimeZone.
type TimeZone string

var ErrTimeZone = errs.ErrSenderBadRequest.Set("Cannot find specified Time Zone")

func (t *TimeZone) UnmarshalJSON(data []byte) error {
	v, err := strconv.Unquote(string(data))
	if err != nil {
		return ErrTimeZone
	}

	if _, err := time.LoadLocation(v); err != nil {
		return ErrTimeZone
	}

	*t = TimeZone(v)

	return nil
}

func (t *TimeZone) String() string {
	if t != nil {
		return string(*t)
	}

	return ""
}

// Scan reads an interface into Email Address.
func (t *TimeZone) Scan(src any) error {
	if s, ok := src.(string); ok {
		*t = TimeZone(s)
	}

	return nil
}

// Value returns a string representation of Email.
func (t TimeZone) Value() (driver.Value, error) {
	return string(t), nil
}
