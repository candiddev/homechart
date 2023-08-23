// Package jwt contains helpers for signing and verifying jwts.
package jwt

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

// RegisteredClaims satisfies the jwt interface.
type RegisteredClaims struct {
	jwt.RegisteredClaims
}

// CustomClaims satisfies the jwt interface.
type CustomClaims interface {
	GetRegisteredClaims() *RegisteredClaims
	Valid() error
}

var ErrMarshalingJWT = errors.New("error marshaling JWT")
var ErrParsingToken = errors.New("error parsing token")
var ErrPrintingJWT = errors.New("error printing JWT")
var ErrNoValidClaims = errors.New("no valid claims found in token")
var ErrUnknownCrypto = errors.New("unknown crypto signer")

// SignJWT signs a JWT.  customClaims must be a pointer.
func SignJWT(key crypto.Signer, customClaims CustomClaims, expiresAt time.Time, audience, issuer, subject string) (string, error) { //nolint:revive
	aud := []string{}

	if audience != "" {
		aud = append(aud, audience)
	}

	var expires *jwt.NumericDate

	if !expiresAt.IsZero() {
		expires = jwt.NewNumericDate(expiresAt)
	}

	c := customClaims.GetRegisteredClaims()
	c.Audience = aud
	c.ExpiresAt = expires
	c.ID = uuid.New().String()
	c.IssuedAt = jwt.NewNumericDate(time.Now())
	c.Issuer = issuer
	c.NotBefore = jwt.NewNumericDate(time.Now())
	c.Subject = subject

	var m jwt.SigningMethod

	switch key.Type() { //nolint:exhaustive
	case crypto.TypeEd25519:
		m = jwt.SigningMethodEdDSA
	case crypto.TypeRSA2048:
		m = jwt.SigningMethodRS256
	default:
		return "", ErrUnknownCrypto
	}

	var t *jwt.Token

	if customClaims == nil {
		t = jwt.New(m)
	} else {
		t = jwt.NewWithClaims(m, customClaims)
	}

	k, err := key.PrivateKey()
	if err != nil {
		return "", err
	}

	return t.SignedString(k)
}

// Print returns a JWT as JSON to stdout.
func Print(ctx context.Context, key crypto.Verifier, customClaims CustomClaims, token string) {
	if _, err := jwt.ParseWithClaims(token, customClaims, func(t *jwt.Token) (any, error) {
		return key.PublicKey()
	}, jwt.WithoutClaimsValidation()); err != nil {
		logger.Log(ctx, errs.NewCLIErr(ErrPrintingJWT, err)) //nolint:errcheck
	}

	j, err := json.MarshalIndent(customClaims, "", "  ")
	if err != nil {
		logger.Log(ctx, errs.NewCLIErr(ErrMarshalingJWT, err)) //nolint:errcheck
	}

	fmt.Print(strings.TrimSpace(string(j)) + "\n") //nolint:forbidigo
}

// VerifyJWT created by SignJWT.  customClaims must be a pointer.
func VerifyJWT(key crypto.Verifier, customClaims CustomClaims, token string) (expiresAt time.Time, err error) {
	t, err := jwt.ParseWithClaims(token, customClaims, func(t *jwt.Token) (any, error) {
		return key.PublicKey()
	})
	if err != nil {
		return time.Time{}, fmt.Errorf("%w: %w", ErrParsingToken, err)
	}

	if claims, ok := t.Claims.(CustomClaims); ok && t.Valid {
		var expires time.Time

		if claims.GetRegisteredClaims().ExpiresAt != nil {
			expires = claims.GetRegisteredClaims().ExpiresAt.Time
		}

		return expires, claims.Valid()
	}

	return time.Time{}, ErrNoValidClaims
}
