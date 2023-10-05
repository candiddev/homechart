package types

import (
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

var ErrStringLimit = errs.ErrSenderBadRequest.Set("Value must be less than 1,000 characters")

// StringLimit a string with a limit of 1000 characters.
type StringLimit string

// UnmarshalJSON is used for JSON unmarshalling.
func (s *StringLimit) UnmarshalJSON(data []byte) error {
	if len([]rune(string(data))) > 1000 {
		return ErrStringLimit
	}

	str, err := strconv.Unquote(string(data))
	if err != nil {
		return err
	}

	*s = StringLimit(str)

	return nil
}
