package types

import (
	"fmt"
	"regexp"
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

// ErrYearMonth means the YearMonth format is invalid.
var ErrYearMonth = errs.ErrSenderBadRequest.Set("YearMonth format should match YYYYMM")

// YearMonth is a year and month concat'd.
type YearMonth int

// YearMonthFromString parses a YearMonth from a string.
func YearMonthFromString(yearMonth string) (YearMonth, error) {
	if yearMonth == "" {
		return 0, ErrYearMonth
	}

	i, err := strconv.Atoi(yearMonth)

	return YearMonth(i), err
}

// Int returns a YearMonth int.
func (y YearMonth) Int() int {
	return int(y)
}

// MarshalJSON converts a YearMonth to JSON.
func (y YearMonth) MarshalJSON() ([]byte, error) {
	return []byte(strconv.Itoa(y.Int())), nil
}

// String returns a YearMonth string.
func (y YearMonth) String() string {
	return strconv.Itoa(y.Int())
}

// StringDash returns a YearMonth string with a dash.
func (y YearMonth) StringDash() string {
	return fmt.Sprintf("%s-%s", y.String()[0:4], y.String()[4:6])
}

// UnmarshalJSON returns a valid YearMonth struct key.
func (y *YearMonth) UnmarshalJSON(data []byte) error {
	if regexp.MustCompile(`^((\d{4}((0[1-9])|(1[0-2])))|0)$`).Match(data) {
		i, err := strconv.Atoi(string(data))
		if err != nil {
			return ErrYearMonth
		}

		*y = YearMonth(i)

		return nil
	}

	return ErrYearMonth
}
