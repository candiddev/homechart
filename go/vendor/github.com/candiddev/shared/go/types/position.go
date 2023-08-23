package types

import (
	"regexp"
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

// ErrPosition means the position is invalid.
var ErrPosition = errs.NewClientBadRequestErr("Position must be formatted as <number>:<a-z>")

// Position is the position of an item in a list.
type Position string

// UnmarshalJSON is used for JSON unmarshalling.
func (p *Position) UnmarshalJSON(data []byte) error {
	var err error

	s, err := strconv.Unquote(string(data))
	if err != nil {
		if string(data) == null {
			return nil
		}

		return err
	}

	if s == "" {
		return nil
	}

	// Test string
	if regexp.MustCompile(`^\d+(:[a-z]+)?$`).MatchString(s) {
		*p = Position(s)

		return nil
	}

	return ErrPosition
}
