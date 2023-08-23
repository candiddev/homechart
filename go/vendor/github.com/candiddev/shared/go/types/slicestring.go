package types

import (
	"database/sql/driver"
	"fmt"
	"strings"
)

// SliceString is a slice of strings.
type SliceString []string

// MarshalJSON converts a slice string to JSON array.
func (s SliceString) MarshalJSON() ([]byte, error) {
	json := "["

	for i, str := range s {
		if str == `""` { // fix bug with some existing slicestrings having empty quotes
			str = ""
		}

		json += fmt.Sprintf(`"%s"`, str)
		if i != len(s)-1 {
			json += ","
		}
	}

	json += "]"

	return []byte(json), nil
}

// Value returns a JSON marshal of the slice string.
func (s SliceString) Value() (driver.Value, error) {
	if len(s) == 0 {
		return []byte("{}"), nil
	}

	var newS SliceString

	for _, item := range s {
		if item != "" {
			newS = append(newS, item)
		}
	}

	output := strings.Join(newS, ",")
	output = fmt.Sprintf("{%s}", output)

	return []byte(output), nil
}

// Scan reads in a byte slice and appends it to the slice.
func (s *SliceString) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if source != "" && source != "{}" && source != "{NULL}" {
			output := strings.TrimRight(strings.TrimLeft(source, "{"), "}")
			array := strings.Split(output, ",")

			slice := SliceString{}

			for _, item := range array {
				if item != `""` && item[0] == '"' {
					slice = append(slice, item[1:len(item)-1])
				} else {
					slice = append(slice, item)
				}
			}

			*s = slice

			return nil
		}
	}

	*s = SliceString{}

	return nil
}
