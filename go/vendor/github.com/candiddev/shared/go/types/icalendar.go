package types

import (
	"bufio"
	"bytes"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"text/template"
	"time"
)

const iCalendarTime = "20060102T150405"

var iCalendarEventsTemplate = template.Must(template.New("iCalendarEvents").Funcs(template.FuncMap{ //nolint:gochecknoglobals
	"allDay": func(duration PositiveInt) bool {
		return duration%24 == 0
	},
	"formatTime": func(t time.Time) string {
		return t.Format(iCalendarTime + "Z")
	},
	"replaceAll": strings.ReplaceAll,
	"trim":       strings.Trim,
}).Parse(`BEGIN:VCALENDAR
VERSION:2.0
DESCRIPTION:Homechart
NAME:Homechart
PRODID:-//Candid Development//Homchart//EN
X-WR-CALDESC:Homechart
X-WR-CALNAME:Homechart
X-WR-TIMEZONE:Etc/GMT
{{- range . }}
BEGIN:VEVENT
{{- if .Details }}
DESCRIPTION:{{ with $q := printf "%+q" .Details }}{{ trim $q "\"" }}{{ end }}
{{- end }}
{{- if .DateEnd }}
DTEND;VALUE=DATE:{{ .DateEnd.ICalendar }}
{{- else if .Duration }}
DURATION:PT{{ .Duration }}M
{{- end }}
{{- if .Created }}
DTSTAMP:{{ formatTime .Created }}
{{- end }}
{{- if .DateStart }}
DTSTART;VALUE=DATE:{{ .DateStart.ICalendar }}
{{- else if .TimestampStart }}
DTSTART:{{ formatTime .TimestampStart }}
{{- end }}
{{- if .SkipDays }}
EXDATE;VALUE=DATE:{{ range $i, $e := .SkipDays }}{{ if $i }},{{ end }}{{ replaceAll $e "-" "" }}{{ end }}
{{- end }}
{{- if .Updated }}
LAST-MODIFIED:{{ formatTime .Updated }}
{{- end }}
{{- if .Location }}
LOCATION:{{ .Location }}
{{- end }}
{{- if .Recurrence }}
RRULE:{{ .Recurrence.ToICalendar .RecurrenceEnd }}
{{- end }}
{{- if .Name }}
SUMMARY;LANGUAGE=en-us:{{ .Name }}
{{- end }}
UID:{{ .ID }}
{{- if .NotifyOffset }}
BEGIN:VALARM
DESCRIPTION:{{ with $q := printf "%+q" .Details }}{{ trim $q "\"" }}{{ end }}
TRIGGER:-PT{{ .NotifyOffset }}M
ACTION:DISPLAY
END:VALARM
{{- end }}
END:VEVENT
{{- end }}
END:VCALENDAR`))

// ICalendarEvent is an iCalendar Event.
type ICalendarEvent struct {
	DateStart      *CivilDate
	DateEnd        *CivilDate
	Duration       PositiveInt
	Details        StringLimit
	ID             StringLimit
	Location       StringLimit
	Name           StringLimit
	TimeZone       string
	NotifyOffset   *int
	SkipDays       SliceString
	TimestampStart *time.Time
	Created        *time.Time
	Updated        *time.Time
	Recurrence     *Recurrence
	RecurrenceEnd  *CivilDate
}

// ICalendarEvents are multiple ICalendarEvent.
type ICalendarEvents []ICalendarEvent

func (e *ICalendarEvents) String() (string, error) {
	var b bytes.Buffer

	err := iCalendarEventsTemplate.Execute(&b, e)
	if err != nil {
		return "", err
	}

	out := strings.ReplaceAll(b.String(), "\n", "\r\n")

	return out, nil
}

var icsDT = regexp.MustCompile(`^(DTSTART|DTEND);?(TZID=(?P<timezone>\S+))?(?P<date>VALUE=DATE)?:(?P<value>.*)`)
var icsDescription = regexp.MustCompile(`^DESCRIPTION:(?P<value>.*)`)
var icsDuration = regexp.MustCompile(`^DURATION:P(?P<week>(\d+)W)?(?P<day>(\d+)D)?T?(?P<hour>(\d+)H)?(?P<minute>(\d+)M)?(?P<second>(\d+)S)?`)
var icsExdate = regexp.MustCompile(`^EXDATE;?(?P<date>VALUE=DATE)?:(?P<value>.*)`)
var icsLocation = regexp.MustCompile(`^LOCATION:(?P<value>.*)`)
var icsRrule = regexp.MustCompile(`^RRULE:FREQ=(\w+);(.*)`)
var icsSummary = regexp.MustCompile(`^SUMMARY;?(LANGUAGE=\S+)?:(?P<value>.*)`)
var icsTrigger = regexp.MustCompile(`^TRIGGER:-P(?P<week>(\d+)W)?(?P<day>(\d+)D)?T?(?P<hour>(\d+)H)?(?P<minute>(\d+)M)?(?P<second>(\d+)S)?`)
var icsUID = regexp.MustCompile(`^UID:(?P<value>.*)`)

func icsParseDate(line, timezone, value string, date bool) (time.Time, error) {
	if date {
		t, err := time.Parse("20060102", value)
		if err != nil {
			return time.Time{}, fmt.Errorf("error parsing %s: %v", line, err)
		}

		return t, nil
	}

	var c time.Time

	var err error

	switch {
	case strings.HasSuffix(value, "Z"):
		c, err = time.Parse(iCalendarTime+"Z", value)
	case timezone != "":
		var l *time.Location

		l, err = time.LoadLocation(timezone)
		if err != nil {
			return time.Time{}, fmt.Errorf("error parsing %s: %v", line, err)
		}

		c, err = time.ParseInLocation(iCalendarTime, value, l)
	default:
		err = fmt.Errorf("error parsing %s", line)
	}

	if err != nil {
		return time.Time{}, fmt.Errorf("error parsing %s: %v", line, err)
	}

	return c, nil
}

func icsParseDuration(value string, results []string) (int, error) {
	d := 0

	// Week
	if results[2] != "" {
		i, err := strconv.Atoi(results[2])
		if err != nil {
			return d, fmt.Errorf("error parsing %s: %v", value, err)
		}

		d += i * 7 * 24 * 60
	}

	// Day
	if results[4] != "" {
		i, err := strconv.Atoi(results[4])
		if err != nil {
			return d, fmt.Errorf("error parsing %s: %v", value, err)
		}

		d += i * 24 * 60
	}

	// Hour
	if results[6] != "" {
		i, err := strconv.Atoi(results[6])
		if err != nil {
			return d, fmt.Errorf("error parsing %s: %v", value, err)
		}

		d += i * 60
	}

	// Minute
	if results[8] != "" {
		i, err := strconv.Atoi(results[8])
		if err != nil {
			return d, fmt.Errorf("error parsing %s: %v", value, err)
		}

		d += i
	}

	// Second
	if results[10] != "" {
		i, err := strconv.Atoi(results[10])
		if err != nil {
			return d, fmt.Errorf("error parsing duration of %s: %v", value, err)
		}

		if i > 60 {
			d += i / 60
		}
	}

	return d, nil
}

// ICalendarEventsFromICS parses events from an ICS string.
func ICalendarEventsFromICS(ics string) (ICalendarEvents, error) { //nolint: gocognit
	events := ICalendarEvents{}

	scanner := bufio.NewScanner(strings.NewReader(ics))

	inEvent := false
	endTime := time.Time{}
	event := ICalendarEvent{}

	for scanner.Scan() {
		t := scanner.Text()

		switch t {
		case "END:VCALENDAR":
			return events, nil
		case "BEGIN:VEVENT":
			event = ICalendarEvent{}
			endTime = time.Time{}
			inEvent = true
		case "END:VEVENT":
			if event.Duration == 0 && event.TimestampStart != nil {
				if endTime.IsZero() {
					event.DateEnd = event.DateStart
				} else {
					event.Duration = PositiveInt(endTime.Sub(*event.TimestampStart).Minutes())
				}
			}

			events = append(events, event)
			inEvent = false
		}

		if !inEvent {
			continue
		}

		if m := icsDT.FindStringSubmatch(t); len(m) == 6 {
			tz := m[3]

			c, err := icsParseDate(t, tz, m[5], m[4] != "")
			if err != nil {
				return nil, err
			}

			if m[1] == "DTEND" {
				endTime = c
				end := CivilDateOf(c)
				event.DateEnd = &end
			} else if m[1] == "DTSTART" {
				if m[4] == "" {
					event.TimestampStart = &c
				} else {
					start := CivilDateOf(c)
					event.DateStart = &start
				}
			}

			if tz != "" {
				event.TimeZone = tz
			}

			continue
		}

		if m := icsDescription.FindStringSubmatch(t); len(m) == 2 {
			event.Details = StringLimit(strings.ReplaceAll(m[1], `\n`, "\n"))

			continue
		}

		if m := icsDuration.FindStringSubmatch(t); len(m) == 11 {
			d, err := icsParseDuration(t, m)
			if err != nil {
				return nil, err
			}

			event.Duration = PositiveInt(d)

			continue
		}

		if m := icsExdate.FindStringSubmatch(t); len(m) == 3 {
			dates := strings.Split(m[2], ",")

			for i := range dates {
				c, err := icsParseDate(t, "", dates[i], m[1] != "")
				if err != nil {
					return nil, fmt.Errorf("error parsing dateStart of %s: %v", t, err)
				}

				event.SkipDays = append(event.SkipDays, CivilDateOf(c).String())
			}

			continue
		}

		if m := icsLocation.FindStringSubmatch(t); len(m) == 2 {
			event.Location = StringLimit(m[1])

			continue
		}

		if m := icsRrule.FindStringSubmatch(t); len(m) == 3 {
			r, e, err := ParseRecurrenceFromICS(t, m)
			if err != nil {
				return nil, err
			}

			event.Recurrence = r
			event.RecurrenceEnd = e
		}

		if m := icsTrigger.FindStringSubmatch(t); len(m) == 11 {
			d, err := icsParseDuration(t, m)
			if err != nil {
				return nil, err
			}

			event.NotifyOffset = &d
		}

		if m := icsSummary.FindStringSubmatch(t); len(m) == 3 {
			event.Name = StringLimit(m[2])

			continue
		}

		if m := icsUID.FindStringSubmatch(t); len(m) == 2 {
			event.ID = StringLimit(m[1])

			continue
		}
	}

	return nil, fmt.Errorf("error parsing ICS: invalid format")
}
