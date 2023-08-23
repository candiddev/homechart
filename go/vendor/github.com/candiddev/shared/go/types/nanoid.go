package types

import (
	"fmt"
	"strconv"

	"github.com/candiddev/shared/go/errs"
	gonanoid "github.com/matoous/go-nanoid/v2"
)

const nanoidLength = 14

var ErrNanoidLength = errs.NewClientBadRequestErr(fmt.Sprintf("Value must be less than or equal to %d characters", nanoidLength))

// Nanoid is a short random ID.
type Nanoid string

// NewNanoid generates a new Nanoid.
func NewNanoid() Nanoid {
	return Nanoid(gonanoid.MustGenerate("0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", nanoidLength))
}

// UnmarshalJSON is used for JSON unmarshalling.
func (n *Nanoid) UnmarshalJSON(data []byte) error {
	if len([]rune(string(data))) > nanoidLength+2 {
		return ErrNanoidLength
	}

	str, err := strconv.Unquote(string(data))
	if err != nil {
		return err
	}

	*n = Nanoid(str)

	return nil
}
