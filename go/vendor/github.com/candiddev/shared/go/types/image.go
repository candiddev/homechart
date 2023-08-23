package types

import (
	"strconv"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/images"
)

// MsgImage is the client message for image format issues.
const MsgImage = "Image format should be base64 encoded image data, either gif, jpeg, or png"

// Image is a base64 encoded image.
type Image string

// UnmarshalJSON is used for JSON unmarshalling.
func (i *Image) UnmarshalJSON(data []byte) error {
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

	// Resize image
	img, err := images.FromData(s)
	if err != nil {
		return errs.NewClientBadRequestErr(MsgImage, err)
	}

	*i = Image(images.Resize(img))

	return err
}
