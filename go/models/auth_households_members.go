package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthHouseholdMember is limited AuthAccount fields.
type AuthHouseholdMember struct {
	AuthHouseholdID uuid.UUID           `json:"authHouseholdID"`
	Color           types.Color         `json:"color"`
	Child           bool                `json:"child"`
	EmailAddress    types.EmailAddress  `format:"email" json:"emailAddress"`
	Name            string              `json:"name"`
	PublicKey       crypto.RSAPublicKey `json:"publicKey"`
	Permissions     Permissions         `json:"permissions"`
	ID              uuid.UUID           `json:"id"`
	InviteToken     types.StringLimit   `json:"inviteToken"`
} // @Name AuthHouseholdMember

// AuthHouseholdMembers is an AuthHouseholdMember slice.
type AuthHouseholdMembers []AuthHouseholdMember

// Scan reads in an AuthHouseholdMembers from a database.
func (a *AuthHouseholdMembers) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[`) {
			err := json.Unmarshal(src.([]byte), a)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// Value converts an AuthHouseholdsMembers to JSON.
func (a AuthHouseholdMembers) Value() (driver.Value, error) {
	j, err := json.Marshal(a)

	return j, err
}
