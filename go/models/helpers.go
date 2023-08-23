package models

import (
	"fmt"
	"hash/crc32"
	"math/rand"
	"regexp"
	"time"

	"github.com/google/uuid"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// GenerateTimestamp creates a RFC3339 timestamp.
func GenerateTimestamp() time.Time {
	t := time.Now().Round(1000 * time.Nanosecond).UTC()

	return t
}

// GenerateUUID creates a v4 UUID.
func GenerateUUID() uuid.UUID {
	id := uuid.New()

	return id
}

// GetCRC calculates the CRC of an interface.
func GetCRC(input any) string {
	return fmt.Sprintf("%08x", crc32.Checksum([]byte(fmt.Sprintf("%v", input)), crc))
}

// ParseUUID parses a UUID from string.
func ParseUUID(s string) uuid.UUID {
	u, err := uuid.Parse(s)
	if err != nil {
		u = uuid.Nil
	}

	return u
}

// ToList turns a string array into a nice list.
func ToList(input []string) (output string) {
	re := regexp.MustCompile(`[#|*]`)

	for i, in := range input {
		output += re.ReplaceAllString(in, " ")

		if i == len(input)-2 {
			output += ", and "
		} else if i != len(input)-1 {
			output += ", "
		}
	}

	return output
}

// getAcknowledgement gets a random acknowledgement.
func getAcknowledgement() (output string) {
	ackIn := rand.Intn(len(acknowledgements)) //nolint:gosec

	if ack := acknowledgements[ackIn]; ack != "" {
		output += ack + ".  "
	}

	return output
}

// getDateOriginal formats a dateOriginal param for speech.
func getDateOriginal(dateOriginal string, prefix bool) string {
	if dateOriginal == "today" || dateOriginal == "tomorrow" || dateOriginal == "tonight" {
		return dateOriginal
	}

	if dateOriginal == "" {
		return "today"
	}

	title := cases.Title(language.English)

	str := title.String(dateOriginal)

	if prefix {
		return "on " + str
	}

	return str
}

// toSpeechList converts a list of strings to a well formed speakable list.
func toSpeechList(err error, input []string, context, itemType, link string) (output, linkOutput string, inputList []string) {
	if err != nil || len(input) == 0 {
		return fmt.Sprintf("I couldn't find any %ss.", itemType), "", input
	}

	output += fmt.Sprintf("%sI found %d %s", getAcknowledgement(), len(input), itemType)

	if len(input) > 1 {
		output += "s"
	}

	if context != "" {
		output += " " + context
	}

	if len(input) > 5 {
		output += ".  Since there are too many to list, I've sent them to your device."

		return output, link, input
	}

	output += ": "
	output += ToList(input)
	output += "."

	return output, "", input
}
