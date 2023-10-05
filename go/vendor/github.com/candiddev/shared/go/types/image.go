package types

import (
	"strconv"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/images"
)

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
		return errs.ErrSenderBadRequest.Set("Image format should be base64 encoded image data, either gif, jpeg, or png").Wrap(err)
	}

	*i = Image(images.Resize(img))

	return err
}
