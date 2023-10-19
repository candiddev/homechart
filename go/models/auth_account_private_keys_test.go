package models

import (
	"encoding/json"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/cryptolib"
)

func TestAuthAccountPrivateKeyUnmarshalJSON(t *testing.T) {
	a := AuthAccountPrivateKey{}

	assert.HasErr(t, json.Unmarshal([]byte(`{"key": "unknown$unknown"}`), &a), cryptolib.ErrUnknownEncryption)
	assert.Equal(t, json.Unmarshal([]byte(`{"encryption": 0, "name": "a"}`), &a), nil)
	assert.Equal(t, a.Name, "a")
}

func TestAuthAccountPrivateKeysScanValue(t *testing.T) {
	e1, _ := cryptolib.None("").EncryptSymmetric([]byte("a"), "")
	e2, _ := cryptolib.None("").EncryptSymmetric([]byte("b"), "")

	a := AuthAccountPrivateKeys{
		{
			Key:  e1,
			Name: "a",
		},
		{
			Key:  e2,
			Name: "b",
		},
	}

	as, _ := a.Value()
	ao := AuthAccountPrivateKeys{}
	ao.Scan(as)

	assert.Equal(t, len(a), len(ao))
}
