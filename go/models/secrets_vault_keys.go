package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/crypto"
	"github.com/google/uuid"
)

// SecretsVaultKey is a key used to decrypt a vault.
type SecretsVaultKey struct {
	AuthAccountID uuid.UUID             `json:"authAccountID"`
	Key           crypto.EncryptedValue `json:"key"`
} // @Name SecretsVaultKey

// SecretsVaultKeys is multiple SecretsVaultKey.
type SecretsVaultKeys []SecretsVaultKey

// Scan reads in SecretsVaultKeys from a database.
func (s *SecretsVaultKeys) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[{`) {
			err := json.Unmarshal(src.([]byte), s)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// Value converts SecretsVaultKeys to JSON.
func (s SecretsVaultKeys) Value() (driver.Value, error) {
	if len(s) == 0 {
		return []byte("[]"), nil
	}

	j, err := json.Marshal(s)

	return j, err
}
