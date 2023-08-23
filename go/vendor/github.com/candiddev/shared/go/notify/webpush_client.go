package notify

import (
	"database/sql/driver"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
)

// WebPushClient stores data for sending a push to a client.
type WebPushClient struct {
	Auth     string `json:"auth"`
	Endpoint string `json:"endpoint"`
	P256     string `json:"p256"`
}

// WebPushClients is multiple WebPushClient.
type WebPushClients []*WebPushClient

func (c *WebPushClient) decode() (auth []byte, p256 []byte, err error) {
	a, err := base64.RawURLEncoding.DecodeString(c.Auth)
	if err != nil {
		return nil, nil, fmt.Errorf("error decoding auth: %w", err)
	}

	p, err := base64.RawURLEncoding.DecodeString(c.P256)
	if err != nil {
		return nil, nil, fmt.Errorf("error decoding p256: %w", err)
	}

	return a, p, nil
}

// Scan reads in a WebPushClient from a database.
func (c *WebPushClient) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `{`) {
			err := json.Unmarshal(src.([]byte), c)

			return err
		} else if source == "{}" {
			return nil
		}
	}

	return nil
}

// Value converts a WebPushClient to JSON.
func (c WebPushClient) Value() (driver.Value, error) {
	j, err := json.Marshal(c)

	return j, err
}

// Scan reads in a WebPushClients from a database.
func (c *WebPushClients) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))

		if strings.Contains(source, `[`) {
			err := json.Unmarshal(src.([]byte), c)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// Value converts a WebPushClients to JSON.
func (c WebPushClients) Value() (driver.Value, error) {
	j, err := json.Marshal(c)

	return j, err
}
