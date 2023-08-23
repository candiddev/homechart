package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/google/uuid"
)

func TestGenerateUUID(t *testing.T) {
	assert.Equal(t, GenerateUUID() != uuid.Nil, true)
}

func TestGenerateTimestamp(t *testing.T) {
	i := GenerateTimestamp()
	assert.Equal(t, i.IsZero(), false)
}

func TestParseUUID(t *testing.T) {
	u := GenerateUUID()

	tests := map[string]uuid.UUID{
		u.String(): u,
		"notauuid": uuid.Nil,
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, ParseUUID(name), tc)
		})
	}
}

func TestToSpeechList(t *testing.T) {
	tests := map[string]struct {
		contains string
		input    []string
	}{
		"none": {
			contains: "I couldn't find any items.",
			input:    []string{},
		},
		"three": {
			contains: "I found 3 items today: a, b, and c.",
			input: []string{
				"a",
				"b",
				"c",
			},
		},
		"six": {
			contains: "I found 6 items today.  Since there are too many to list, I've sent them to your device",
			input: []string{
				"a",
				"b",
				"c",
				"d",
				"e",
				"f",
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			speech, url, list := toSpeechList(nil, tc.input, "today", "item", "/link")

			assert.Contains(t, speech, tc.contains)

			if len(tc.input) > 5 {
				assert.Equal(t, url, "/link")
			}

			assert.Equal(t, len(list), len(tc.input))
		})
	}
}
