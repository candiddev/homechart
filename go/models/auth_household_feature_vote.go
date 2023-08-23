package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/types"
)

// AuthHouseholdFeatureVote is a collection of feature votes for an AuthHousehold.
type AuthHouseholdFeatureVote struct {
	Amount  types.ScaleInt    `json:"amount"`
	Feature int               `json:"feature"`
	Comment types.StringLimit `json:"comment"`
} // @name AuthHouseholdFeatureVote

// AuthHouseholdFeatureVotes is multiple AuthHouseholdFeatureVote.
type AuthHouseholdFeatureVotes []AuthHouseholdFeatureVote

// Scan reads in an AuthHouseholdFeatureVotes from a database.
func (a *AuthHouseholdFeatureVotes) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[`) {
			err := json.Unmarshal(src.([]byte), a)

			return err
		}
	}

	*a = AuthHouseholdFeatureVotes{}

	return nil
}

// Value converts an AuthHouseholdFeatureVotes to JSON.
func (a AuthHouseholdFeatureVotes) Value() (driver.Value, error) {
	j, err := json.Marshal(a)

	return j, err
}
