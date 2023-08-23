package images

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/jpeg"

	"github.com/disintegration/imaging"
)

// Resize takes in an image and resizes it, returning a base64 JPEG.
func Resize(img image.Image) string {
	var err error

	img = imaging.Fit(img, 300, 300, imaging.Lanczos)

	var buf bytes.Buffer
	err = jpeg.Encode(&buf, img, nil)

	if err != nil {
		return ""
	}

	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
}
