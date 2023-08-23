package models

import (
	"database/sql/driver"
	"encoding/json"
	"strings"

	"github.com/candiddev/shared/go/crypto"
)

// AuthAccountPrivateKeyProvider is an enum for private key provider types.
type AuthAccountPrivateKeyProvider string

// AuthAccountPrivateKeyProvider is an enum for private key provider types.
const (
	AuthAccountPrivateKeyProviderNone           AuthAccountPrivateKeyProvider = "none"
	AuthAccountPrivateKeyProviderPasswordPBKDF2 AuthAccountPrivateKeyProvider = "passwordPBKDF2"
)

// AuthAccountPrivateKey is the contents of a private key.
type AuthAccountPrivateKey struct {
	Name     string                        `json:"name"`
	Key      crypto.EncryptedValue         `json:"key"`
	Provider AuthAccountPrivateKeyProvider `json:"provider"`
} // @Name AuthAccountPrivateKey

// UnmarshalJSON is used for JSON unmarshalling.
func (a *AuthAccountPrivateKey) UnmarshalJSON(data []byte) error {
	type tmpA AuthAccountPrivateKey

	var ap tmpA

	if err := json.Unmarshal(data, &ap); err != nil {
		return err
	}

	*a = AuthAccountPrivateKey(ap)

	return nil
}

// AuthAccountPrivateKeys is multiple AuthAccountPrivateKey.
type AuthAccountPrivateKeys []AuthAccountPrivateKey

// MarshalJSON converts an AuthAccountPrivateKeys to JSON array.
func (a AuthAccountPrivateKeys) MarshalJSON() ([]byte, error) {
	if a == nil {
		return []byte("[]"), nil
	}

	type tmpKeys AuthAccountPrivateKeys

	return json.Marshal(tmpKeys(a))
}

// Scan reads in AuthAccountPrivateKeys from a database.
func (a *AuthAccountPrivateKeys) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[{`) {
			err := json.Unmarshal(src.([]byte), a)

			return err
		}
	}

	*a = AuthAccountPrivateKeys{}

	return nil
}

// Value converts AuthAccountPrivateKeys to JSON.
func (a AuthAccountPrivateKeys) Value() (driver.Value, error) {
	if len(a) == 0 {
		return []byte("[]"), nil
	}

	j, err := json.Marshal(a)

	return j, err
}
