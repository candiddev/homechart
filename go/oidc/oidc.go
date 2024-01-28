// Package oidc contains functions for using OIDC with Homechart.
package oidc

import (
	"context"
	"errors"
	"fmt"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/coreos/go-oidc"
	"golang.org/x/oauth2"
)

var ErrProvider = errs.ErrReceiver.Wrap(errors.New("oidc provider error"))

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
		logger.Error(ctx, ErrProvider.Wrap(err)) //nolint:errcheck

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

	logger.Error(ctx, nil, p.Name) //nolint:errcheck

	return &p
}

// Setup initializes OIDC providers and returns them.
func Setup(ctx context.Context, c *config.Config) (*Providers, errs.Err) {
	ctx = logger.Trace(ctx)
	providers := Providers{}

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

	return &providers, logger.Error(ctx, nil, fmt.Sprintf("initialized %d", len(providers)))
}
