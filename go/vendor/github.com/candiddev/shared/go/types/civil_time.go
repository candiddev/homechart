package types

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/candiddev/shared/go/errs"
)

// MsgCivilTime is the client message for time format issues.
const MsgCivilTime = "Time format should match HH:MM"

// CivilTime represents a hour and minute.
type CivilTime struct {
	Hour   int
	Minute int
}

const civilTimeRegex = `^(\d{2}):(\d{2})$`

// CivilTimeOf converts a time.Time to CivilTime.
func CivilTimeOf(t time.Time) CivilTime {
	var c CivilTime
	c.Hour, c.Minute, _ = t.Clock()

	return c
}

// ParseCivilTime takes a time string and returns CivilTime.
func ParseCivilTime(s string) (CivilTime, error) {
	r := regexp.MustCompile(civilTimeRegex).FindStringSubmatch((s))

	var c CivilTime

	var err error

	if len(r) != 3 {
		return CivilTime{}, errs.NewClientBadRequestErr(MsgCivilTime, errors.New("invalid regexp match"))
	}

	c.Hour, err = strconv.Atoi(r[1])
	if err != nil || c.Hour < 0 || c.Hour > 23 {
		return CivilTime{}, errs.NewClientBadRequestErr(MsgCivilTime, errors.New("couldn't parse hour"))
	}

	c.Minute, err = strconv.Atoi(r[2])
	if err != nil || c.Minute < 0 || c.Minute > 59 {
		return CivilTime{}, errs.NewClientBadRequestErr(MsgCivilTime, errors.New("couldn't parse minute"))
	}

	return c, nil
}

// String12 returns a string representation of CivilTime in 12 hour time.
func (c CivilTime) String12() string {
	if c.Hour > 12 {
		return fmt.Sprintf("%d:%02d PM", c.Hour-12, c.Minute)
	}

	if c.Hour == 0 {
		return fmt.Sprintf("12:%02d AM", c.Minute)
	}

	if c.Hour == 12 {
		return fmt.Sprintf("12:%02d PM", c.Minute)
	}

	return fmt.Sprintf("%d:%02d AM", c.Hour, c.Minute)
}

// String returns a string representation of CivilTime.
func (c CivilTime) String() string {
	return fmt.Sprintf("%02d:%02d", c.Hour, c.Minute)
}

// AddMinutes adds or subtracts minutes from CivilTime.
func (c CivilTime) AddMinutes(n int) CivilTime {
	tn := time.Date(0, 0, 0, c.Hour, c.Minute, 0, 0, time.UTC)

	return CivilTimeOf(tn.Add(time.Duration(n) * time.Minute))
}

// MarshalJSON is used for JSON marshalling.
func (c CivilTime) MarshalJSON() ([]byte, error) {
	return []byte(strconv.Quote(c.String())), nil
}

// UnmarshalJSON is used for JSON unmarshalling.
func (c *CivilTime) UnmarshalJSON(data []byte) error {
	var err error

	s, err := strconv.Unquote(string(data))
	if err != nil {
		if string(data) == null {
			return nil
		}

		return err
	}

	*c, err = ParseCivilTime(s)

	return err
}

// Value returns a string representation of CivilTime.
func (c CivilTime) Value() (driver.Value, error) {
	return c.String(), nil
}

// Scan reads an interface into CivilTime.
func (c *CivilTime) Scan(src any) error {
	if src != nil {
		*c = CivilTimeOf(src.(time.Time))
	}

	return nil
}
