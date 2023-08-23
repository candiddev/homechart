package types

import (
	"database/sql/driver"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

// UUIDToNullUUID converts a UUID to a NullUUID.
func UUIDToNullUUID(id uuid.UUID) *uuid.NullUUID {
	return &uuid.NullUUID{
		UUID:  id,
		Valid: true,
	}
}

// UUIDs are multiple UUID.
type UUIDs []uuid.UUID

// String returns the Database Value but without an error.
func (u UUIDs) String() string {
	if len(u) == 0 {
		return "{}"
	}

	s := []string{}

	for _, item := range u {
		s = append(s, item.String())
	}

	output := strings.Join(s, ",")
	output = fmt.Sprintf("{%s}", output)

	return output
}

// Value returns a JSON marshal of the slice string.
func (u UUIDs) Value() (driver.Value, error) {
	return []byte(u.String()), nil
}
