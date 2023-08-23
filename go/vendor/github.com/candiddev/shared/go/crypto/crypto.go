// Package crypto contains crypto helper functions that should be safe.
package crypto

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/types"
)

// Type is the type of crypto.
type Type string

// Type is the type of crypto.
const (
	TypeNone      Type = "none"
	TypeAES128GCM Type = "aes128gcm"
	TypeEd25519   Type = "ed25519"
	TypeRSA2048   Type = "rsa2048"
)

var ErrUnknownEncryption = errors.New("unknown encryption")

// EncryptedValue is a decoded encrypted value.
type EncryptedValue struct {
	Ciphertext string
	Encryption Type
}

// Decrypter is used to decrypt things.
type Decrypter interface {
	Decrypt(value string) (string, error)
}

// Encrypter is used to encrypt things.
type Encrypter interface {
	Encrypt(value string) (string, error)
	Type() Type
}

// Signer is used to sign something like a JWT.
type Signer interface {
	PrivateKey() (any, error)
	Type() Type
}

// Verifier is used to verify something like a JWT.
type Verifier interface {
	PublicKey() (any, error)
	Type() Type
}

// ParseEncryptedValue turns a string into an EncryptedValue or error.
func ParseEncryptedValue(s string) (EncryptedValue, error) {
	if r := strings.Split(s, "$"); len(r) == 2 {
		var e Type

		switch Type(r[0]) {
		case TypeNone:
			e = TypeNone
		case TypeAES128GCM:
			e = TypeAES128GCM
		case TypeRSA2048:
			e = TypeRSA2048
		case TypeEd25519:
			e = TypeRSA2048
		}

		if e != "" {
			return EncryptedValue{
				Ciphertext: r[1],
				Encryption: e,
			}, nil
		}
	}

	return EncryptedValue{}, ErrUnknownEncryption
}

// EncryptValue encrypts a value using an Encrypter.
func EncryptValue(e Encrypter, value string) (EncryptedValue, error) {
	var c string

	var err error

	var t Type

	if e == nil {
		c = value
		t = TypeNone
	} else {
		c, err = e.Encrypt(value)
		t = e.Type()
	}

	return EncryptedValue{
		Ciphertext: c,
		Encryption: t,
	}, err
}

// Decrypt uses a Decrypter to decrypt an EncryptedValue.
func (e *EncryptedValue) Decrypt(d Decrypter) (string, error) {
	if d == nil {
		return e.Ciphertext, nil
	}

	return d.Decrypt(e.Ciphertext)
}

func (e EncryptedValue) MarshalJSON() ([]byte, error) {
	output := ""

	if e != (EncryptedValue{}) {
		output = strconv.Quote(e.String())
	}

	return []byte(output), nil
}

func (e *EncryptedValue) String() string {
	return fmt.Sprintf("%s$%s", e.Encryption, e.Ciphertext)
}

func (e *EncryptedValue) UnmarshalJSON(data []byte) error {
	var err error

	s, err := strconv.Unquote(string(data))
	if err != nil {
		return err
	}

	*e, err = ParseEncryptedValue(s)

	return err
}

func (e EncryptedValue) Value() (driver.Value, error) {
	if e.Encryption == "" {
		return "", nil
	}

	return e.String(), nil
}

func (e *EncryptedValue) Scan(src any) error {
	var err error

	if src != nil {
		*e, err = ParseEncryptedValue(src.(string))
	}

	return err
}

// EncryptedValues is multiple EncryptedValue.
type EncryptedValues []EncryptedValue

func (e EncryptedValues) SliceString() types.SliceString {
	s := types.SliceString{}

	for i := range e {
		s = append(s, e[i].String())
	}

	return s
}

func (e EncryptedValues) MarshalJSON() ([]byte, error) {
	return e.SliceString().MarshalJSON()
}

func (e EncryptedValues) Value() (driver.Value, error) {
	return e.SliceString().Value()
}

func (e *EncryptedValues) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if source != "" && source != "{}" && source != "{NULL}" {
			output := strings.TrimRight(strings.TrimLeft(source, "{"), "}")
			array := strings.Split(output, ",")

			slice := EncryptedValues{}

			for i := range array {
				var s string

				if array[i] != `""` && array[i][0] == '"' {
					s = array[i][1 : len(array[i])-1]
				} else {
					s = array[i]
				}

				v, err := ParseEncryptedValue(s)
				if err != nil {
					return err
				}

				slice = append(slice, v)
			}

			*e = slice

			return nil
		}
	}

	*e = EncryptedValues{}

	return nil
}
