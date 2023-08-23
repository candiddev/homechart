package models

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthHouseholdPermissions is a mapping of permissions to an AuthHouseholdID.
type AuthHouseholdPermissions struct {
	AuthHouseholdID uuid.UUID   `json:"authHouseholdID"`
	Permissions     Permissions `json:"permissions"`
} // @Name AuthHouseholdPermissions

// AuthHouseholdsPermissions is multiple AuthHouseholdPermissions.
type AuthHouseholdsPermissions []AuthHouseholdPermissions

// Scan reads in an AuthHouseholdsPermissions from a database.
func (a *AuthHouseholdsPermissions) Scan(src any) error {
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

// IsEscalated checks if an AuthHousehold permissions are escalated.
func (a AuthHouseholdsPermissions) IsEscalated(np AuthHouseholdsPermissions) bool {
	for i := range a {
		for j := range np {
			if np[j].AuthHouseholdID == a[i].AuthHouseholdID {
				if a[i].Permissions.IsEscalated(np[j].Permissions) {
					return true
				}

				break
			}
		}
	}

	return false
}

// Sanitize removes duplicate and invalid AuthHouseholdPermissions.  AuthSession.Read will never "trust" the AuthHouseholdsPermissions in AuthSession, but we shouldn't let users add whatever they want here either.
func (a *AuthHouseholdsPermissions) Sanitize(ctx context.Context, authAccountID uuid.UUID) {
	if a != nil {
		ap := AuthHouseholdsPermissions{}

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

// Get finds an AuthHousehold permission.
func (a AuthHouseholdsPermissions) Get(id *uuid.UUID) *Permissions {
	if id != nil {
		for i := range a {
			if a[i].AuthHouseholdID == *id {
				return &a[i].Permissions
			}
		}
	}

	return nil
}

// GetIDs lists all AuthHouseholdIDs.
func (a AuthHouseholdsPermissions) GetIDs() types.UUIDs {
	t := types.UUIDs{}
	for i := range a {
		t = append(t, a[i].AuthHouseholdID)
	}

	return t
}

// IsPermitted checks if an AuthHousehold permission is allowed.
func (a AuthHouseholdsPermissions) IsPermitted(id *uuid.UUID, cmp PermissionComponent, n Permission) bool {
	if id != nil {
		for i := range a {
			if a[i].AuthHouseholdID == *id {
				return a[i].Permissions.IsPermitted(cmp, n, false)
			}
		}
	}

	return false
}

// Value converts an AuthHouseholdsPermissions to JSON.
func (a AuthHouseholdsPermissions) Value() (driver.Value, error) {
	j, err := json.Marshal(a)

	return j, err
}
