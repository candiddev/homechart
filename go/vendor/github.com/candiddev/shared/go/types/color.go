package types

import (
	"fmt"
	"strconv"

	"github.com/candiddev/shared/go/errs"
)

// MsgColor is the client message for color format issues.
const MsgColor = "Color must be non-negative and less than 12"

// Color is an enum for a UI color.
type Color int

// Color is an enum for a UI color.
const (
	ColorDefault Color = iota
	ColorRed
	ColorPink
	ColorOrange
	ColorYellow
	ColorGreen
	ColorTeal
	ColorBlue
	ColorIndigo
	ColorPurple
	ColorBrown
	ColorBlack
	ColorGray
	ColorWhite
)

// UnmarshalJSON is used for JSON unmarshalling.
func (c *Color) UnmarshalJSON(data []byte) error {
	i, err := strconv.Atoi(string(data))

	if err != nil {
		return err
	}

	v := Color(i)

	if v < ColorDefault || v > ColorWhite {
		return errs.NewClientBadRequestErr(MsgColor, fmt.Errorf("color has invalid value: %d", v))
	}

	*c = v

	return nil
}
