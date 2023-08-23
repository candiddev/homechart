package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthAccountPreferences is a collection of preferences for an AuthAccount.
type AuthAccountPreferences struct {
	ColorAccent                   types.Color                                   `json:"colorAccent"`
	ColorNegative                 types.Color                                   `json:"colorNegative"`
	ColorPositive                 types.Color                                   `json:"colorPositive"`
	ColorPrimary                  types.Color                                   `json:"colorPrimary"`
	ColorSecondary                types.Color                                   `json:"colorSecondary"`
	FormatDateOrder               types.CivilDateOrder                          `json:"formatDateOrder"`
	FormatDateSeparator           types.CivilDateSeparator                      `json:"formatDateSeparator"`
	NotificationsHouseholds       AuthAccountPreferencesNotificationsHouseholds `json:"notificationsHouseholds"`
	HideCalendarHealthLogs        types.SliceString                             `json:"hideCalendarHealthLogs"`
	HideComponents                types.SliceString                             `json:"hideComponents"`
	HideCalendarCookMealPlans     bool                                          `json:"hideCalendarCookMealPlans"`
	HideCalendarEvents            bool                                          `json:"hideCalendarEvents"`
	HideCalendarPlanTasks         bool                                          `json:"hideCalendarPlanTasks"`
	HideCalendarBudgetRecurrences bool                                          `json:"hideCalendarBudgetRecurrences"`
	DarkMode                      bool                                          `json:"darkMode"`
	FormatTime24                  bool                                          `json:"formatTime24"`
	FormatWeek8601                bool                                          `json:"formatWeek8601"`
	IgnoreDeviceAgenda            bool                                          `json:"ignoreDeviceAgenda"`
	IgnoreDeviceCalendarEvent     bool                                          `json:"ignoreDeviceCalendarEvent"`
	IgnoreDevicePlanTask          bool                                          `json:"ignoreDevicePlanTask"`
	IgnoreEmailAgenda             bool                                          `json:"ignoreEmailAgenda"`
	IgnoreEmailCalendarEvent      bool                                          `json:"ignoreEmailCalendarEvent"`
	IgnoreEmailNewsletter         bool                                          `json:"ignoreEmailNewsletter"`
	IgnoreEmailPlanTask           bool                                          `json:"ignoreEmailPlanTask"`
	ShowCalendarEventAstronomy    bool                                          `json:"showCalendarEventAstronomy"`
	ShowCalendarEventHolidaysCA   bool                                          `json:"showCalendarEventHolidaysCA"` //nolint: tagliatelle
	ShowCalendarEventHolidaysUK   bool                                          `json:"showCalendarEventHolidaysUK"` //nolint: tagliatelle
	ShowCalendarEventHolidaysUS   bool                                          `json:"showCalendarEventHolidaysUS"` //nolint: tagliatelle
} // @Name AuthAccountPreferences

// Scan reads in a AuthAccountPreferences from a database.
func (a *AuthAccountPreferences) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), a)

			return err
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

// Value converts an AuthAccountPreferences to JSON.
func (a AuthAccountPreferences) Value() (driver.Value, error) {
	j, err := json.Marshal(a)

	return j, err
}

// AuthAccountPreferencesNotificationsHousehold are notification preferences for an AuthHouseholdID.
type AuthAccountPreferencesNotificationsHousehold struct {
	AuthHouseholdID              uuid.UUID `json:"authHouseholdID"`
	IgnoreDeviceCalendarEvent    bool      `json:"ignoreDeviceCalendarEvent"`
	IgnoreDeviceCookMealPlanCook bool      `json:"ignoreDeviceCookMealPlanCook"`
	IgnoreDeviceCookMealPlanPrep bool      `json:"ignoreDeviceCookMealPlanPrep"`
	IgnoreDevicePlanTask         bool      `json:"ignoreDevicePlanTask"`
	IgnoreDevicePlanTaskComplete bool      `json:"ignoreDevicePlanTaskComplete"`
	IgnoreEmailCalendarEvent     bool      `json:"ignoreEmailCalendarEvent"`
	IgnoreEmailCookMealPlanCook  bool      `json:"ignoreEmailCookMealPlanCook"`
	IgnoreEmailCookMealPlanPrep  bool      `json:"ignoreEmailCookMealPlanPrep"`
	IgnoreEmailPlanTask          bool      `json:"ignoreEmailPlanTask"`
} // @Name AuthAccountPreferencesNotificationsHousehold

// AuthAccountPreferencesNotificationsHouseholds is multiple AuthAccountPreferencesNotificationsHousehold.
type AuthAccountPreferencesNotificationsHouseholds []AuthAccountPreferencesNotificationsHousehold

// Get returns an AuthAccountPreferencesNotificationsHousehold for an AuthHouseholdID.
func (a *AuthAccountPreferencesNotificationsHouseholds) Get(id *uuid.UUID) AuthAccountPreferencesNotificationsHousehold {
	if a != nil && id != nil {
		for i := range *a {
			if (*a)[i].AuthHouseholdID == *id {
				return (*a)[i]
			}
		}
	}

	return AuthAccountPreferencesNotificationsHousehold{}
}

// Sanitize removes invalid notification entries.
func (a *AuthAccountPreferencesNotificationsHouseholds) Sanitize(ctx context.Context, authAccountID uuid.UUID) {
	if a != nil {
		ap := AuthAccountPreferencesNotificationsHouseholds{}

		var aaah AuthAccountAuthHouseholds

		if _, _, err := ReadAll(ctx, &aaah, ReadAllOpts{
			PermissionsOpts: PermissionsOpts{
				AuthAccountID:          &authAccountID,
				AuthAccountPermissions: &Permissions{},
			},
		}); err != nil {
			*a = ap

			return
		}

		for i := range *a {
			valid := false

			for j := range aaah {
				if aaah[j].AuthHouseholdID == (*a)[i].AuthHouseholdID {
					valid = true

					break
				}
			}

			if !valid {
				continue
			}

			dupe := false

			for k := range ap {
				if (*a)[i].AuthHouseholdID == ap[k].AuthHouseholdID {
					dupe = true

					break
				}
			}

			if !dupe {
				ap = append(ap, (*a)[i])
			}
		}

		*a = ap
	}
}
