package oidc

import (
	"context"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/coreos/go-oidc"
)

var ErrClient = errs.NewClientBadRequestErr("OIDC verification failed")

func (p *Provider) getIDToken(ctx context.Context, code string) (*oidc.IDToken, errs.Err) {
	token, err := p.Config.Exchange(ctx, code)
	if err != nil {
		return nil, logger.Log(ctx, ErrProvider, err.Error())
	}

	rawToken, ok := token.Extra("id_token").(string)
	if !ok {
		return nil, logger.Log(ctx, ErrProvider, err.Error())
	}

	verifier := p.Provider.Verifier(&oidc.Config{
		ClientID: p.Config.ClientID,
	})

	idToken, err := verifier.Verify(ctx, rawToken)
	if err != nil {
		return nil, logger.Log(ctx, ErrProvider, err.Error())
	}

	return idToken, logger.Log(ctx, nil)
}

// GetClaims reads in OIDC claims from a code.
func (p *Providers) GetClaims(ctx context.Context, providerType ProviderType, code string) (emailAddress types.EmailAddress, id string, err errs.Err) {
	ctx = logger.Trace(ctx)

	var idToken *oidc.IDToken

	if p != nil {
		for _, provider := range *p {
			if provider.Type == providerType {
				idToken, err = provider.getIDToken(ctx, code)
				if err != nil {
					logger.Log(ctx, err) //nolint:errcheck

					continue
				}

				var claims struct {
					Email string `json:"email"`
					Sub   string `json:"sub"`
				}

				err := idToken.Claims(&claims)
				if err != nil {
					logger.Log(ctx, ErrClient, err.Error()) //nolint:errcheck

					continue
				}

				emailAddress = types.EmailAddress(claims.Email)
				id = claims.Sub
			}
		}
	}

	if id == "" || emailAddress == "" {
		return emailAddress, id, logger.Log(ctx, ErrClient)
	}

	return emailAddress, id, logger.Log(ctx, nil)
}
