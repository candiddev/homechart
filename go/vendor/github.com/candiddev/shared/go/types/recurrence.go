package types

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
)

var ErrRecurrence = errs.NewClientBadRequestErr("Invalid recurrence combination")
var ErrRecurrenceDay = errs.NewClientBadRequestErr("Day must be less than 31 or greater than -31")
var ErrRecurrenceMonthWeek = errs.NewClientBadRequestErr("Month Week must be less than 4 or greater than -4")
var ErrRecurrenceSeparation = errs.NewClientBadRequestErr("Separation must be positive")
var ErrRecurrenceWeekdayDuplicate = errs.NewClientBadRequestErr("Weekday must not include duplicate days")
var ErrRecurrenceWeekdayValue = errs.NewClientBadRequestErr("Weekday must be less than 7 or greater than 0")

// Recurrence represents a recurring date.
type Recurrence struct {
	Day        int        `json:"day"`
	Separation int        `json:"separation"`
	MonthWeek  int        `json:"monthWeek"`
	Month      time.Month `json:"month" swaggertype:"integer"`
	Weekday    Weekday    `json:"weekday"`
	Weekdays   []Weekday  `json:"weekdays"`
} // @Name Recurrence

var iCalendarWeekdays = []string{ //nolint:gochecknoglobals
	"MO",
	"TU",
	"WE",
	"TH",
	"FR",
	"SA",
	"SU",
}

var icsRruleByday = regexp.MustCompile(`^(-?\d)(\w+)`)

// ParseRecurrenceFromICS parses a RRULE from an ICS file and returns a Recurrence.
func ParseRecurrenceFromICS(value string, match []string) (r *Recurrence, end *CivilDate, err error) { //nolint: gocognit
	r = &Recurrence{}

	for _, rule := range strings.Split(match[2], ";") {
		v := strings.Split(rule, "=")
		if len(v) != 2 {
			return nil, nil, fmt.Errorf("error parsing %s: invalid format", value)
		}

		switch v[0] {
		case "BYMONTH":
			i, err := strconv.Atoi(v[1])
			if err != nil {
				return nil, nil, fmt.Errorf("error parsing %s: %v", value, err)
			}

			r.Month = time.Month(i)
		case "BYDAY":
			days := strings.Split(v[1], ",")

			for _, day := range days {
				d := icsRruleByday.FindStringSubmatch(day)
				if len(d) == 3 && d[1] != "" {
					day = d[2]

					r.MonthWeek, err = strconv.Atoi(d[1])
					if err != nil {
						return nil, nil, fmt.Errorf("error parsing %s: %v", value, err)
					}
				}

				for i := range iCalendarWeekdays {
					if iCalendarWeekdays[i] == day {
						if match[1] == "WEEKLY" {
							r.Weekdays = append(r.Weekdays, Weekday(i+1))
						} else {
							r.Weekday = Weekday(i + 1)
						}
					}
				}
			}

		case "BYMONTHDAY":
			r.Day, err = strconv.Atoi(v[1])
			if err != nil {
				return nil, nil, fmt.Errorf("error parsing %s: %v", value, err)
			}
		case "INTERVAL":
			r.Separation, err = strconv.Atoi(v[1])
			if err != nil {
				return nil, nil, fmt.Errorf("error parsing %s: %v", value, err)
			}
		case "UNTIL":
			t, err := icsParseDate(value, "", v[1], false)
			if err != nil {
				return nil, nil, fmt.Errorf("error parsing %s: %v", value, err)
			}

			e := CivilDateOf(t)
			end = &e
		}
	}

	if r.Separation == 0 {
		r.Separation = 1
	}

	if err := r.Validate(); err != nil {
		return nil, end, fmt.Errorf("error parsing %s: %v", value, err)
	}

	return r, end, nil
}

// ToICalendar renders an iCalendar RRULE of the recurrence.
func (r Recurrence) ToICalendar(dateEnd *CivilDate) string {
	output := ""

	switch {
	case r.Month != 0:
		output = fmt.Sprintf("FREQ=YEARLY;BYMONTH=%d", r.Month)

		fallthrough
	case r.Day != 0 || r.MonthWeek != 0:
		if output == "" {
			output = "FREQ=MONTHLY"
		}

		if r.MonthWeek != 0 {
			output += fmt.Sprintf(";BYDAY=%d%s", r.MonthWeek, iCalendarWeekdays[r.Weekday-1])
		} else {
			output += fmt.Sprintf(";BYMONTHDAY=%d", r.Day)
		}
	case len(r.Weekdays) != 0:
		output = "FREQ=WEEKLY;WKST=SU;BYDAY="

		for i := range r.Weekdays {
			output += iCalendarWeekdays[r.Weekdays[i]-1]

			if i < len(r.Weekdays)-1 {
				output += ","
			}
		}
	default:
		output = "FREQ=DAILY"
	}

	if dateEnd != nil {
		output += ";UNTIL=" + dateEnd.ICalendar() + "T000000Z"
	}

	return fmt.Sprintf("%s;INTERVAL=%d", output, r.Separation)
}

// Scan reads in a Recurrence from a database.
func (r *Recurrence) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			// TODO use the real unmarshal function, if we use it now it may block database reads for certain values
			type tmpRec Recurrence

			var rec tmpRec

			if err := json.Unmarshal(src.([]byte), &rec); err != nil {
				return err
			}

			*r = Recurrence(rec)
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

func (r *Recurrence) UnmarshalJSON(b []byte) error {
	type tmpR Recurrence

	var rec tmpR

	if err := json.Unmarshal(b, &rec); err != nil {
		return err
	}

	*r = Recurrence(rec)

	return r.Validate()
}

// Validate checks that a recurrence is valid.
func (r *Recurrence) Validate() errs.Err { //nolint:gocognit,gocyclo
	// Check each value
	if r.Day > 31 || r.Day < 0 {
		return ErrRecurrenceDay
	}

	if r.Separation < 0 {
		return ErrRecurrenceSeparation
	}

	if r.MonthWeek > 4 || r.MonthWeek < -4 {
		return ErrRecurrenceMonthWeek
	}

	if r.Weekday > 7 || r.Weekday < 0 {
		return ErrRecurrenceMonthWeek
	}

	days := []Weekday{}

	for _, weekday := range r.Weekdays {
		if weekday < 0 || weekday > 7 {
			return ErrRecurrenceWeekdayValue
		}

		for _, day := range days {
			if weekday == day {
				return ErrRecurrenceWeekdayDuplicate
			}
		}

		days = append(days, weekday)
	}
	// Check combinations
	// None (none)
	if r.Day == 0 && r.Month == 0 && r.MonthWeek == 0 && r.Separation != 0 && r.Weekday == 0 && len(r.Weekdays) == 0 {
		return nil
	}

	// Every X days (separation only)
	if r.Day == 0 && r.Month == 0 && r.MonthWeek == 0 && r.Separation != 0 && r.Weekday == 0 && len(r.Weekdays) == 0 {
		return nil
	}

	// Every X weekdays (weekday)
	if r.Day == 0 && r.Month == 0 && r.MonthWeek == 0 && r.Separation != 0 && r.Weekday == 0 && len(r.Weekdays) != 0 {
		return nil
	}

	// Every day of X months (day)
	if r.Day != 0 && r.Month == 0 && r.MonthWeek == 0 && r.Separation != 0 && r.Weekday == 0 && len(r.Weekdays) == 0 {
		return nil
	}

	// Every weekday of monthweek of X months (monthweek weekday)
	if r.Day == 0 && r.Month == 0 && r.MonthWeek != 0 && r.Separation != 0 && r.Weekday != 0 && len(r.Weekdays) == 0 {
		return nil
	}

	// Every day of month of X years (month day)
	if r.Day != 0 && r.Month != 0 && r.MonthWeek == 0 && r.Separation != 0 && r.Weekday == 0 && len(r.Weekdays) == 0 {
		return nil
	}

	// Every weekday of monthweek of month of X years (month monthweek weekday)
	if r.Day == 0 && r.Month != 0 && r.MonthWeek != 0 && r.Separation != 0 && r.Weekday != 0 && len(r.Weekdays) == 0 {
		return nil
	}

	return ErrRecurrence
}

// Value converts a Recurrence to JSON.
func (r Recurrence) Value() (driver.Value, error) {
	j, err := json.Marshal(r)

	return j, err
}
