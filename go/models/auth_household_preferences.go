package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/types"
)

// AuthHouseholdPreferences is a collection of preferences for an AuthHousehold.
type AuthHouseholdPreferences struct {
	ColorBudgetRecurrenceEvents types.Color       `json:"colorBudgetRecurrenceEvents"`
	ColorCookMealPlanEvents     types.Color       `json:"colorCookMealPlanEvents"`
	ColorPlanTaskEvents         types.Color       `json:"colorPlanTaskEvents"`
	Currency                    types.Currency    `json:"currency"`
	HideComponents              types.SliceString `json:"hideComponents"`
} // @Name AuthHouseholdPreferences

// Scan reads in an AuthHouseholdPreferences from a database.
func (a *AuthHouseholdPreferences) Scan(src any) error {
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

// Value converts an AuthHouseholdPreferences to JSON.
func (a AuthHouseholdPreferences) Value() (driver.Value, error) {
	j, err := json.Marshal(a)

	return j, err
}
