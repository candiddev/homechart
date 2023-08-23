package types

import (
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

// ErrPositiveInt means the value is negative.
var ErrPositiveInt = errs.NewClientBadRequestErr("Value must not be negative")

// PositiveInt is a non-negative number.
type PositiveInt int

// UnmarshalJSON is used for JSON unmarshalling.
func (p *PositiveInt) UnmarshalJSON(data []byte) error {
	i, err := strconv.Atoi(string(data))

	if err != nil {
		return err
	}

	v := PositiveInt(i)

	if v < 0 {
		return ErrPositiveInt
	}

	*p = v

	return nil
}
