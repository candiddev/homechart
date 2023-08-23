package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/google/uuid"
)

// HealthItemCorrelations correlates HealthItems.
type HealthItemCorrelations map[uuid.UUID]int // @Name HealthItemCorrelations

// Scan reads in a HealthItemCorrelations from a database.
func (h *HealthItemCorrelations) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), h)

			return err
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

// Value converts a HealthItemCorrelations to JSON.
func (h HealthItemCorrelations) Value() (driver.Value, error) {
	if len(h) == 0 {
		return []byte("{}"), nil
	}

	j, err := json.Marshal(h)

	return j, err
}
