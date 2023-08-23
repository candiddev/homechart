package crypto

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"fmt"
	"sync"

	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// Ed25519PrivateKey is a private key type.
type Ed25519PrivateKey string

// Ed25519PublicKey is a public key type.
type Ed25519PublicKey string

// Ed25519PublicKeys is multiple Ed25519PublicKey.
type Ed25519PublicKeys []Ed25519PublicKey

var ErrEd25519DecodingPrivateKey = errors.New("error decoding base64 Ed25519 private key")
var ErrEd25519DecodingPublicKey = errors.New("error decoding base64 Ed25519 public key")
var ErrEd25519GeneratingPrivateKey = errors.New("error generating Ed25519 private key")
var ErrEd25519MarshalingPublicKey = errors.New("error marshaling Ed25519 public key")
var ErrEd25519MarshalingPrivateKey = errors.New("error marshaling Ed25519 private key")
var ErrEd25519NoPrivateKey = errors.New("no Ed25519 private key found")
var ErrEd25519NoPublicKey = errors.New("no Ed25519 public key found")
var ErrEd25519ParsingPrivateKey = errors.New("error parsing Ed25519 private key")
var ErrEd25519ParsingPublicKey = errors.New("error parsing Ed25519 public key")

var ed25519PrivateKeys = struct { //nolint: gochecknoglobals
	keys  map[*Ed25519PrivateKey]ed25519.PrivateKey
	mutex sync.Mutex
}{
	keys: map[*Ed25519PrivateKey]ed25519.PrivateKey{},
}

var ed25519PublicKeys = struct { //nolint: gochecknoglobals
	keys  map[*Ed25519PublicKey]ed25519.PublicKey
	mutex sync.Mutex
}{
	keys: map[*Ed25519PublicKey]ed25519.PublicKey{},
}

// NewEd25519 generates a new Ed25519 private/public keypair.
func NewEd25519() (privateKey Ed25519PrivateKey, publicKey Ed25519PublicKey, err error) {
	public, private, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrEd25519GeneratingPrivateKey, err)
	}

	x509Private, err := x509.MarshalPKCS8PrivateKey(private)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrEd25519MarshalingPrivateKey, err)
	}

	x509Public, err := x509.MarshalPKIXPublicKey(public)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrEd25519MarshalingPublicKey, err)
	}

	return Ed25519PrivateKey(base64.StdEncoding.EncodeToString(x509Private)), Ed25519PublicKey(base64.StdEncoding.EncodeToString(x509Public)), nil
}

func (e *Ed25519PrivateKey) decode() (ed25519.PrivateKey, error) {
	ed25519PrivateKeys.mutex.Lock()

	defer ed25519PrivateKeys.mutex.Unlock()

	var ok bool

	var p ed25519.PrivateKey

	if p, ok = ed25519PrivateKeys.keys[e]; !ok {
		bytesPrivate, err := base64.StdEncoding.DecodeString(string(*e))
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrEd25519DecodingPrivateKey, err)
		}

		private, err := x509.ParsePKCS8PrivateKey(bytesPrivate)
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrEd25519ParsingPrivateKey, err)
		}

		if p, ok = private.(ed25519.PrivateKey); !ok {
			return nil, ErrEd25519NoPrivateKey
		}

		ed25519PrivateKeys.keys[e] = p
	}

	return p, nil
}

func (e Ed25519PrivateKey) PrivateKey() (any, error) {
	return e.decode()
}

func (Ed25519PrivateKey) Type() Type {
	return TypeEd25519
}

func (e *Ed25519PublicKey) decode() (ed25519.PublicKey, error) {
	ed25519PublicKeys.mutex.Lock()

	defer ed25519PublicKeys.mutex.Unlock()

	var ok bool

	var p ed25519.PublicKey

	if p, ok = ed25519PublicKeys.keys[e]; !ok {
		bytesPublic, err := base64.StdEncoding.DecodeString(string(*e))
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrEd25519DecodingPublicKey, err)
		}

		public, err := x509.ParsePKIXPublicKey(bytesPublic)
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrEd25519ParsingPublicKey, err)
		}

		if p, ok = public.(ed25519.PublicKey); !ok {
			return nil, ErrEd25519NoPublicKey
		}

		ed25519PublicKeys.keys[e] = p
	}

	return p, nil
}

func (e Ed25519PublicKey) PublicKey() (any, error) {
	return e.decode()
}

func (Ed25519PublicKey) Type() Type {
	return TypeEd25519
}

// GenerateEd25519 is a helper function for CLI apps to generate an Ed25519 public/private keypair.
func GenerateEd25519[T cli.AppConfig[any]](ctx context.Context, _ []string, c T) errs.Err {
	prv, pub, err := NewEd25519()
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(err))
	}

	m := map[string]string{
		"privateKey": string(prv),
		"publicKey":  string(pub),
	}

	c.CLIConfig().Print(m)

	return nil
}
