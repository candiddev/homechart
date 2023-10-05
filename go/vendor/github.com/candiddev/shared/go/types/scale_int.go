package types

import (
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

var ErrScaleInt = errs.ErrSenderBadRequest.Set("Value must be between 0 and 5")

// ScaleInt is a number between 0 and 5.
type ScaleInt int

// UnmarshalJSON is used for JSON unmarshalling.
func (s *ScaleInt) UnmarshalJSON(data []byte) error {
	i, err := strconv.Atoi(string(data))

	if err != nil {
		return err
	}

	v := ScaleInt(i)

	if v < 0 || v > 5 {
		return ErrScaleInt
	}

	*s = v

	return nil
}
