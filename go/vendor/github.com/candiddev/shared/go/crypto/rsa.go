package crypto

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"fmt"
	"sync"

	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// RSAPrivateKey is a private key type.
type RSAPrivateKey string

// RSAPublicKey is a public key type.
type RSAPublicKey string

var ErrRSADecodingPrivateKey = errors.New("error decoding base64 RSA private key")
var ErrRSADecodingPublicKey = errors.New("error decoding base64 RSA public key")
var ErrRSADecodingValue = errors.New("error decoding base64 RSA value")
var ErrRSADecrypting = errors.New("error decrypting with RSA private key")
var ErrRSAEncrypting = errors.New("error encrypting with RSA public key")
var ErrRSAGeneratingPrivateKey = errors.New("error generating RSA private key")
var ErrRSAMarshalingPublicKey = errors.New("error marshaling RSA public key")
var ErrRSAMarshalingPrivateKey = errors.New("error marshaling RSA private key")
var ErrRSANoPrivateKey = errors.New("no RSA private key found")
var ErrRSANoPublicKey = errors.New("no RSA public key found")
var ErrRSAParsingPrivateKey = errors.New("error parsing RSA private key")
var ErrRSAParsingPublicKey = errors.New("error parsing RSA public key")

var rsaPrivateKeys = struct { //nolint: gochecknoglobals
	keys  map[RSAPrivateKey]*rsa.PrivateKey
	mutex sync.Mutex
}{
	keys: map[RSAPrivateKey]*rsa.PrivateKey{},
}

var rsaPublicKeys = struct { //nolint: gochecknoglobals
	keys  map[RSAPublicKey]*rsa.PublicKey
	mutex sync.Mutex
}{
	keys: map[RSAPublicKey]*rsa.PublicKey{},
}

var rsaOAEPHash = sha256.New() //nolint: gochecknoglobals

// NewRSA generates an RSA private and public key.
func NewRSA() (privateKey RSAPrivateKey, publicKey RSAPublicKey, err error) {
	rsaPrivate, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrRSAGeneratingPrivateKey, err)
	}

	x509Private, err := x509.MarshalPKCS8PrivateKey(rsaPrivate)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrRSAMarshalingPrivateKey, err)
	}

	x509Public, err := x509.MarshalPKIXPublicKey(&rsaPrivate.PublicKey)
	if err != nil {
		return "", "", fmt.Errorf("%w: %w", ErrRSAMarshalingPublicKey, err)
	}

	return RSAPrivateKey(base64.StdEncoding.EncodeToString(x509Private)), RSAPublicKey(base64.StdEncoding.EncodeToString(x509Public)), nil
}

func (r RSAPrivateKey) decode() (*rsa.PrivateKey, error) {
	rsaPrivateKeys.mutex.Lock()

	defer rsaPrivateKeys.mutex.Unlock()

	var ok bool

	var p *rsa.PrivateKey

	if p, ok = rsaPrivateKeys.keys[r]; !ok {
		bytesPrivate, err := base64.StdEncoding.DecodeString(string(r))
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrRSADecodingPrivateKey, err)
		}

		private, err := x509.ParsePKCS8PrivateKey(bytesPrivate)
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrRSAParsingPrivateKey, err)
		}

		if p, ok = private.(*rsa.PrivateKey); !ok {
			return nil, ErrRSANoPrivateKey
		}

		rsaPrivateKeys.keys[r] = p
	}

	return p, nil
}

func (r RSAPrivateKey) Decrypt(value string) (string, error) {
	p, err := r.decode()
	if err != nil {
		return "", err
	}

	i, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrRSADecodingPublicKey, err)
	}

	out, err := rsa.DecryptOAEP(rsaOAEPHash, rand.Reader, p, i, nil)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrRSADecrypting, err)
	}

	return string(out), nil
}

func (r RSAPublicKey) decode() (*rsa.PublicKey, error) {
	rsaPublicKeys.mutex.Lock()

	defer rsaPublicKeys.mutex.Unlock()

	var ok bool

	var p *rsa.PublicKey

	if p, ok = rsaPublicKeys.keys[r]; !ok {
		bytesPublic, err := base64.StdEncoding.DecodeString(string(r))
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrRSADecodingPublicKey, err)
		}

		public, err := x509.ParsePKIXPublicKey(bytesPublic)
		if err != nil {
			return nil, fmt.Errorf("%w: %w", ErrRSAParsingPublicKey, err)
		}

		if p, ok = public.(*rsa.PublicKey); !ok {
			return nil, ErrRSANoPublicKey
		}

		rsaPublicKeys.keys[r] = p
	}

	return p, nil
}

func (r RSAPublicKey) Encrypt(value string) (string, error) {
	p, err := r.decode()
	if err != nil {
		return "", err
	}

	out, err := rsa.EncryptOAEP(rsaOAEPHash, rand.Reader, p, []byte(value), nil)
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrRSAEncrypting, err)
	}

	return base64.StdEncoding.EncodeToString(out), nil
}

func (RSAPublicKey) Type() Type {
	return TypeRSA2048
}

// GenerateRSA2048 is a helper function for CLI apps to generate an RSA-2048 public/private keypair.
func GenerateRSA2048[T cli.AppConfig[any]](ctx context.Context, _ []string, c T) errs.Err {
	prv, pub, err := NewRSA()
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
