package crypto

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"sync"

	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// AESKey is a key used for AES encryption.
type AESKey string

var ErrAESCreatingCipher = errors.New("error creating AES cipher")
var ErrAESDecodingKey = errors.New("error decoding AES key")
var ErrAESDecodingValue = errors.New("error decoding base64 AES value")
var ErrAESDecrypting = errors.New("error decrypting with AES")
var ErrAESGeneratingGCM = errors.New("error generating AES GCM")
var ErrAESGeneratingKey = errors.New("error generating AES key")
var ErrAESGeneratingNonce = errors.New("error generating AES nonce")
var ErrAESValueLength = errors.New("length of value to decode with AES is less than 13")

var aesKeys = struct { //nolint: gochecknoglobals
	keys  map[AESKey]cipher.Block
	mutex sync.Mutex
}{
	keys: map[AESKey]cipher.Block{},
}

// NewAESKey generates a new AES key or an error.
func NewAESKey() (AESKey, error) {
	key := make([]byte, 16) // 16 bytes is an AES128 key

	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESGeneratingKey, err)
	}

	return AESKey(base64.StdEncoding.EncodeToString(key)), nil
}

func (k AESKey) decode() (cipher.Block, error) {
	aesKeys.mutex.Lock()

	defer aesKeys.mutex.Unlock()

	var ok bool

	var b cipher.Block

	if b, ok = aesKeys.keys[k]; !ok {
		bytesKey, err := base64.StdEncoding.DecodeString(string(k))
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrAESDecodingKey, err)
		}

		b, err = aes.NewCipher(bytesKey)
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrAESCreatingCipher, err)
		}

		aesKeys.keys[k] = b
	}

	return b, nil
}

func (k AESKey) Encrypt(value string) (string, error) {
	b, err := k.decode()
	if err != nil {
		return "", err
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESGeneratingNonce, err)
	}

	gcm, err := cipher.NewGCM(b)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESGeneratingGCM, err)
	}

	output := gcm.Seal(nonce, nonce, []byte(value), nil)

	return base64.StdEncoding.EncodeToString(output), nil
}

func (k AESKey) Decrypt(value string) (string, error) {
	b, err := k.decode()
	if err != nil {
		return "", err
	}

	i, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESDecodingValue, err)
	}

	if len(i) < 13 {
		return "", ErrAESValueLength
	}

	gcm, err := cipher.NewGCM(b)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESGeneratingGCM, err)
	}

	output, err := gcm.Open(nil, i[:12], i[12:], nil)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrAESDecrypting, err)
	}

	return string(output), nil
}

func (AESKey) Type() Type {
	return TypeAES128GCM
}

// GenerateAES128 s a helper function for CLI apps to generate an AES-128 key.
func GenerateAES128[T cli.AppConfig[any]](ctx context.Context, _ []string, _ T) errs.Err {
	key, err := NewAESKey()
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(err))
	}

	fmt.Printf("%s\n", key) //nolint:forbidigo

	return nil
}
