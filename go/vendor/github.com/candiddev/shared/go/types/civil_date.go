package types

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
)

var ErrParseCivilDate = errs.ErrSenderBadRequest.Set("Date format should match YYYY-MM-DD").Wrap(errors.New("error parsing CivilDate"))

// CivilDate represents a year, month and day.
type CivilDate struct {
	Year  int
	Month time.Month `swaggertype:"integer"`
	Day   int
} // @Name CivilDate

// CivilDateOrder is the date order for a CivilDate.
type CivilDateOrder int

// CivilDateOrder is the date order for a CivilDate.
const (
	CivilDateOrderMDY CivilDateOrder = iota
	CivilDateOrderDMY
	CivilDateOrderYMD
)

// CivilDateSeparator is the date separator for a CivilDate.
type CivilDateSeparator int

// CivilDateSeparator is the date separator for a CivilDate.
const (
	CivilDateSeparatorForwardSlash CivilDateSeparator = iota
	CivilDateSeparatorDash
	CivilDateSeparatorPeriod
	CivilDateSeparatorComma
)

// CivilDateToday gets the current local date.
func CivilDateToday() CivilDate {
	var c CivilDate
	c.Year, c.Month, c.Day = time.Now().Local().Date()

	return c
}

// CivilDateOf converts a time.Time to CivilDate.
func CivilDateOf(t time.Time) CivilDate {
	var c CivilDate
	c.Year, c.Month, c.Day = t.Date()

	return c
}

// MapToCivilDate takes a map and returns a CivilDate.
func MapToCivilDate(m map[string]any) CivilDate {
	c := CivilDate{}

	if yearI, okI := m["year"]; okI {
		if year, ok := yearI.(float64); ok {
			c.Year = int(year)
		}
	}

	if monthI, okI := m["month"]; okI {
		if month, ok := monthI.(float64); ok {
			c.Month = time.Month(month)
		}
	}

	if dayI, okI := m["day"]; okI {
		if day, ok := dayI.(float64); ok {
			c.Day = int(day)
		}
	}

	return c
}

// ParseCivilDate takes a date string and returns a CivilDate.
func ParseCivilDate(s string) (CivilDate, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return CivilDate{}, ErrParseCivilDate.Wrap(err)
	}

	return CivilDateOf(t), nil
}

// GetDay returns a string of the day.
func (c CivilDate) GetDay() string {
	return fmt.Sprintf("%02d", c.Day)
}

// GetMonth returns a string of the month.
func (c CivilDate) GetMonth() string {
	return fmt.Sprintf("%02d", c.Month)
}

// GetTime returns a time.
func (c CivilDate) GetTime() (time.Time, error) {
	return time.Parse("2006-01-02", c.String())
}

// GetYear returns a string of the year.
func (c CivilDate) GetYear() string {
	return fmt.Sprintf("%04d", c.Year)
}

// ICalendar returns an iCalendar date format.
func (c CivilDate) ICalendar() string {
	return fmt.Sprintf("%04d%02d%02d", c.Year, c.Month, c.Day)
}

// IsZero checks if CivilDate has a value.
func (c CivilDate) IsZero() bool {
	return c.Day == 0 && c.Month == 0 && c.Year == 0
}

// String returns a string representation of a CivilDate.
func (c CivilDate) String() string {
	return fmt.Sprintf("%s-%s-%s", c.GetYear(), c.GetMonth(), c.GetDay())
}

// StringFormat returns a string representation of a CivilDate in the appropriate format.
func (c CivilDate) StringFormat(order CivilDateOrder, separator CivilDateSeparator) string {
	var date []string

	var sep string

	switch order {
	case CivilDateOrderMDY:
		date = []string{
			c.GetMonth(),
			c.GetDay(),
			c.GetYear(),
		}
	case CivilDateOrderDMY:
		date = []string{
			c.GetDay(),
			c.GetMonth(),
			c.GetYear(),
		}
	case CivilDateOrderYMD:
		date = []string{
			c.GetYear(),
			c.GetMonth(),
			c.GetDay(),
		}
	}

	switch separator {
	case CivilDateSeparatorComma:
		sep = ","
	case CivilDateSeparatorDash:
		sep = "-"
	case CivilDateSeparatorForwardSlash:
		sep = "/"
	case CivilDateSeparatorPeriod:
		sep = "."
	}

	return strings.Join(date, sep)
}

// YearMonth returns a YearMonth representation of a CivilDate.
func (c CivilDate) YearMonth() YearMonth {
	y := c.Year * 100
	y += int(c.Month)

	return YearMonth(y)
}

// AddDays adds or subtracts days from a CivilDate.
func (c CivilDate) AddDays(n int) CivilDate {
	t := time.Date(c.Year, c.Month, c.Day, 0, 0, 0, 0, time.UTC)

	return CivilDateOf(t.UTC().AddDate(0, 0, n))
}

// AddMonths adds or subtracts months from a CivilDate.
func (c CivilDate) AddMonths(n int) CivilDate {
	newMonth := (int(c.Month) + n) % 12

	if newMonth < 0 {
		newMonth += 12
	}

	if c.Day > 28 && newMonth == 2 {
		c.Day = 28 //nolint:revive
	} else if c.Day > 30 && newMonth == 2 || newMonth == 4 || newMonth == 6 || newMonth == 9 || newMonth == 11 {
		c.Day = 30 //nolint:revive
	}

	t := time.Date(c.Year, c.Month, c.Day, 0, 0, 0, 0, time.UTC)

	return CivilDateOf(t.UTC().AddDate(0, n, 0))
}

// After checks if c1 occurs after CivilDate.
func (c CivilDate) After(c1 CivilDate) bool {
	if c.Year != c1.Year {
		return c.Year > c1.Year
	}

	if c.Month != c1.Month {
		return c.Month > c1.Month
	}

	return c.Day > c1.Day
}

// MarshalJSON is used for JSON marshalling.
func (c CivilDate) MarshalJSON() ([]byte, error) {
	if c == (CivilDate{}) {
		return []byte(null), nil
	}

	return []byte(strconv.Quote(c.String())), nil
}

// UnmarshalJSON is used for JSON unmarshalling.
func (c *CivilDate) UnmarshalJSON(data []byte) error {
	var err error

	s, err := strconv.Unquote(string(data))
	if err != nil {
		if string(data) == null {
			return nil
		}

		return err
	}

	*c, err = ParseCivilDate(s)
	if err != nil {
		// Try parsing a timestamp
		t, terr := time.Parse(time.RFC3339, s)
		if terr != nil {
			return err
		}

		*c = CivilDateOf(t)
		err = nil
	}

	return err
}

// Value returns a string representation of CivilDate.
func (c CivilDate) Value() (driver.Value, error) {
	if c == (CivilDate{}) {
		return nil, nil
	}

	return c.String(), nil
}

// Scan reads an interface into CivilDate.
func (c *CivilDate) Scan(src any) error {
	if src != nil {
		*c = CivilDateOf(src.(time.Time))
	}

	return nil
}
