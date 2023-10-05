package types

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

// version = 19: https://pkg.go.dev/golang.org/x/crypto/argon2#pkg-constants
const argonFormat = `$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s`

// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const argonMemory = 16 * 1024
const argonParallelism = 1
const argonSaltSize = 16
const argonTime = 2

var ErrClientBadRequestPassword = errs.ErrSenderBadRequest.Set("Incorrect password")
var ErrClientBadRequestInvalidPasswordHash = errs.ErrSenderBadRequest.Set("Unrecognized password hash format")
var ErrClientBadRequestPasswordLength = errs.ErrSenderBadRequest.Set("Passwords must be at least 8 characters")
var ErrServerGeneratingPasswordHash = errs.ErrReceiver.Wrap(errors.New("unable to generate a secure password hash"))

func argonBase64Encode(src []byte) []byte {
	l := base64.RawStdEncoding.EncodedLen(len(src))
	out := make([]byte, l)
	base64.RawStdEncoding.Encode(out, src)

	return out
}

// Password is a valid password.
type Password string

// CompareHashAndPassword checks a password against a hashedPassword.
func (p *Password) CompareHashAndPassword(hashedPassword string) error {
	switch {
	case strings.HasPrefix(hashedPassword, "$2a"):
		if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(*p)); err == nil {
			return nil
		}
	case strings.HasPrefix(hashedPassword, "$argon2id$v=19"):
		split := strings.Split(hashedPassword, "$")

		if len(split) == 6 {
			out, err := base64.RawStdEncoding.DecodeString(split[4])
			if err != nil {
				return ErrClientBadRequestInvalidPasswordHash.Wrap(err)
			}

			hash, err := p.Hash(out)
			if err != nil {
				return ErrClientBadRequestPassword.Wrap(err)
			}

			if hash == hashedPassword {
				return nil
			}
		}
	}

	return ErrClientBadRequestPassword.Wrap(errors.New("unknown password format"))
}

// Hash creates a hashed password.
func (p *Password) Hash(salt []byte) (string, errs.Err) {
	if salt == nil {
		salt = make([]byte, argonSaltSize)

		if _, err := io.ReadFull(rand.Reader, salt); err != nil {
			return "", ErrServerGeneratingPasswordHash.Wrap(err)
		}
	}

	return fmt.Sprintf(argonFormat, argonMemory, argonTime, argonParallelism, string(argonBase64Encode(salt)), string(argonBase64Encode(argon2.IDKey([]byte(*p), salt, argonTime, argonMemory, argonParallelism, 32)))), nil
}

// String returns a Password string.
func (p Password) String() string {
	return string(p)
}

// MarshalJSON converts a password a string.
func (p Password) MarshalJSON() ([]byte, error) {
	q := strconv.Quote(p.String())

	return []byte(q), nil
}

// UnmarshalJSON returns a valid Password struct key.
func (p *Password) UnmarshalJSON(data []byte) error {
	v, err := strconv.Unquote(string(data))
	if err != nil {
		return ErrClientBadRequestPasswordLength.Wrap(err)
	}

	if regexp.MustCompile(`(^.{8})|^$`).MatchString(v) {
		*p = Password(v)

		return nil
	}

	return ErrClientBadRequestPasswordLength.Wrap(errors.New("invalid password length"))
}
