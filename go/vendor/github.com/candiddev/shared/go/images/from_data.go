package images

import (
	"encoding/base64"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"strings"
)

// FromData converts an image formatted as data to an Image.
func FromData(data string) (img image.Image, err error) {
	if strings.HasPrefix(data, "data") {
		rawSplit := strings.Split(data, ",")
		if len(rawSplit) != 2 {
			return img, err
		}

		rawHeader := rawSplit[0]
		rawBase64 := rawSplit[1]
		b64 := base64.NewDecoder(base64.StdEncoding, strings.NewReader(rawBase64))

		switch {
		case strings.Contains(rawHeader, "image/gif"):
			return gif.Decode(b64)
		case strings.Contains(rawHeader, "image/jpeg"):
			return jpeg.Decode(b64)
		case strings.Contains(rawHeader, "image/png"):
			return png.Decode(b64)
		}
	}

	// Guess that this is a JPEG image
	b64 := base64.NewDecoder(base64.StdEncoding, strings.NewReader(data))

	return jpeg.Decode(b64)
}
