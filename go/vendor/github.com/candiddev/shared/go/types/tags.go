package types

import (
	"database/sql/driver"
	"encoding/json"
	"strings"
)

// Tags is a formatted slice strings.
type Tags SliceString

// MarshalJSON converts a tags to JSON array.
func (t Tags) MarshalJSON() ([]byte, error) {
	return SliceString(t).MarshalJSON()
}

// Value returns a JSON marshal of the tags.
func (t Tags) Value() (driver.Value, error) {
	return SliceString(t).Value()
}

// UnmarshalJSON returns a JSON marshal of the the slice string.
func (t *Tags) UnmarshalJSON(data []byte) error {
	s := []string{}

	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	t.ParseSlice(s)

	return nil
}

// Scan reads in a byte slice and appends it to the tag.
func (t *Tags) Scan(src any) error {
	s := SliceString{}

	if err := s.Scan(src); err != nil {
		return err
	}

	*t = Tags(s)

	return nil
}

// ParseSlice converts a SliceString to Tags.
func (t *Tags) ParseSlice(s []string) {
	keys := make(map[string]bool)
	tags := Tags{}

	for _, item := range s {
		item = strings.ToLower(item)
		item = strings.ReplaceAll(item, " ", "")

		if _, value := keys[item]; !value {
			keys[item] = true

			tags = append(tags, item)
		}
	}

	*t = tags
}
