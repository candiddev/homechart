package types

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// TableNotify is how change notices are formatted.
type TableNotify struct {
	AuthAccountID   *uuid.UUID           `json:"authAccountID,omitempty"`
	AuthHouseholdID *uuid.UUID           `json:"authHouseholdID,omitempty"`
	ID              uuid.UUID            `json:"id"`
	Operation       TableNotifyOperation `json:"operation"`
	Table           string               `json:"table"`
	Updated         *time.Time           `json:"updated"` // Updated is the old timestamp when the operation is an update.
} // @Name TableNotify

// TableNotifyOperation is the type of operation that triggered the notification.
type TableNotifyOperation int

// TableNotifyOperation is the type of operation that triggered the notification.
const (
	TableNotifyOperationCreate TableNotifyOperation = iota
	TableNotifyOperationDelete
	TableNotifyOperationUpdate
)

// TableNotifyFromString takes a string and outputs a TableNotice and error.
func TableNotifyFromString(s string) (*TableNotify, error) {
	var t TableNotify

	err := json.Unmarshal([]byte(s), &t)

	return &t, err
}

// String returns a TableNotify to string.
func (t TableNotify) String() string {
	t.AuthAccountID = nil   //nolint:revive
	t.AuthHouseholdID = nil //nolint:revive

	j, err := json.Marshal(t)
	if err != nil {
		return ""
	}

	return string(j)
}
