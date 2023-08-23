// Package oidc contains functions for using OIDC with Homechart.
package oidc

import (
	"context"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/coreos/go-oidc"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/oauth2"
)

var ErrProvider = errs.NewServerErr(errors.New("OIDC provider error"))

// Provider contains settings for an Provider.
type Provider struct {
	Config   *oauth2.Config
	Name     string
	Options  []oauth2.AuthCodeOption
	Provider *oidc.Provider
	Type     ProviderType
}

// Providers is multiple Provider.
type Providers []*Provider

// ProviderType is the provider for OIDC.
type ProviderType int

// ProviderType is the provider for OIDC.
const (
	ProviderTypeNone ProviderType = iota
	ProviderTypeTest
	ProviderTypeGoogle
	ProviderTypeApple
)

type providerOpts struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	IssuerURL    string
	Name         string
	Scopes       []string
	Type         ProviderType
}

func initProvider(ctx context.Context, opts *providerOpts) *Provider {
	var p Provider

	var err error

	p.Name = opts.Name
	p.Type = opts.Type

	p.Provider, err = oidc.NewProvider(ctx, opts.IssuerURL)
	if err != nil {
		logger.Log(ctx, ErrProvider, err.Error()) //nolint:errcheck

		return &p
	}

	p.Config = &oauth2.Config{
		ClientID:     opts.ClientID,
		ClientSecret: opts.ClientSecret,
		Scopes:       opts.Scopes,
		Endpoint:     p.Provider.Endpoint(),
	}

	if opts.BaseURL != "" {
		p.Config.RedirectURL = fmt.Sprintf("%s/oidc?provider=%d", opts.BaseURL, p.Type)
	}

	logger.Log(ctx, nil, p.Name) //nolint:errcheck

	return &p
}

func initAppleProvider(ctx context.Context, c *config.Config) *Provider {
	var baseURL string

	var clientID string

	baseURL = c.App.BaseURL
	clientID = c.OIDC.AppleClientID

	claims := &jwt.RegisteredClaims{
		Audience:  jwt.ClaimStrings{"https://appleid.apple.com"},
		Issuer:    c.OIDC.AppleTeamID,
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(15777000 * time.Second)), // 6 months for Apple
		Subject:   clientID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)

	token.Header = map[string]any{
		"alg": "ES256",
		"kid": c.OIDC.AppleKeyID,
		"typ": "JWT",
	}

	keyStr, err := base64.StdEncoding.DecodeString(c.OIDC.AppleKeyPEMBase64)
	if err != nil {
		logger.Log(ctx, ErrProvider, err.Error()) //nolint:errcheck

		return nil
	}

	keyPEM, _ := pem.Decode(keyStr)

	key, err := x509.ParsePKCS8PrivateKey(keyPEM.Bytes)
	if err != nil {
		logger.Log(ctx, ErrProvider, err.Error()) //nolint:errcheck

		return nil
	}

	jwt, err := token.SignedString(key)
	if err != nil {
		logger.Log(ctx, ErrProvider, err.Error()) //nolint:errcheck

		return nil
	}

	a := initProvider(ctx, &providerOpts{
		BaseURL:      baseURL,
		ClientID:     clientID,
		ClientSecret: jwt,
		IssuerURL:    "https://appleid.apple.com",
		Name:         "apple",
		Scopes: []string{
			"email",
		},
		Type: ProviderTypeApple,
	})
	if a != nil {
		a.Options = []oauth2.AuthCodeOption{
			oauth2.SetAuthURLParam("response_mode", "form_post"),
		}
	}

	return a
}

// Setup initializes OIDC providers and returns them.
func Setup(ctx context.Context, c *config.Config) (*Providers, errs.Err) {
	ctx = logger.Trace(ctx)
	providers := Providers{}

	if c.OIDC.AppleClientID != "" && c.OIDC.AppleKeyID != "" && c.OIDC.AppleKeyPEMBase64 != "" && c.OIDC.AppleTeamID != "" {
		a := initAppleProvider(ctx, c)
		if a != nil {
			providers = append(providers, a)
		}
	}

	if c.OIDC.GoogleClientID != "" && c.OIDC.GoogleClientSecret != "" {
		g := initProvider(ctx, &providerOpts{
			BaseURL:      c.App.BaseURL,
			ClientID:     c.OIDC.GoogleClientID,
			ClientSecret: c.OIDC.GoogleClientSecret,
			IssuerURL:    "https://accounts.google.com",
			Name:         "google",
			Scopes: []string{
				"email",
				"profile",
			},
			Type: ProviderTypeGoogle,
		})
		if g != nil {
			g.Options = []oauth2.AuthCodeOption{
				oauth2.AccessTypeOnline,
			}

			providers = append(providers, g)
		}
	}

	return &providers, logger.Log(ctx, nil, fmt.Sprintf("initialized %d", len(providers)))
}
