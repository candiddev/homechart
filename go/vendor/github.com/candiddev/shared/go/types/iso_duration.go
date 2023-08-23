package types

import (
	"regexp"
	"strconv"
)

// ISODuration is a string formatted with ISODuration.
type ISODuration string

// Minutes returns the number of minutes for an ISODuration.
func (d ISODuration) Minutes() int {
	if d == "" {
		return 0
	}

	durationRegex := regexp.MustCompile(`P((?P<years>\d+)Y)?((?P<months>\d+)M)?((?P<days>\d+)D)?T?((?P<hours>\d+)H)?((?P<minutes>\d+)M)?((?P<seconds>\d+)S)?`)
	matches := durationRegex.FindStringSubmatch(string(d))

	days, _ := strconv.Atoi(matches[6])
	hours, _ := strconv.Atoi(matches[8])
	minutes, _ := strconv.Atoi(matches[10])
	seconds, _ := strconv.Atoi(matches[12])

	minutes += seconds / 60

	if seconds%60 != 0 {
		minutes++
	}

	return minutes + (hours * 60) + (days * 24 * 60)
}
