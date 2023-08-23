package controllers

import (
	"net/http"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// OIDCRedirect contains fields for an OIDC redirect.
type OIDCRedirect struct {
	State uuid.UUID `json:"state"`
	URL   string    `json:"url"`
}

// OIDCProviders contains OIDC providers.
type OIDCProviders []oidc.ProviderType

// OIDCReadProviders returns enabled providers for OIDC.
func (h *Handler) OIDCReadProviders(w http.ResponseWriter, r *http.Request) {
	providers := OIDCProviders{}
	for _, provider := range *h.OIDCProviders {
		providers = append(providers, provider.Type)
	}

	WriteResponse(r.Context(), w, providers, nil, len(providers), "", nil)
}

// OIDCReadRedirect generates redirects for OIDC.
func (h *Handler) OIDCReadRedirect(w http.ResponseWriter, r *http.Request) {
	for _, provider := range *h.OIDCProviders {
		if strings.EqualFold(provider.Name, chi.URLParam(r, "provider")) {
			state := models.GenerateUUID()
			a := OIDCRedirect{
				State: state,
				URL:   provider.Config.AuthCodeURL(state.String(), provider.Options...),
			}

			WriteResponse(r.Context(), w, a, nil, 1, "", nil)
		}
	}
}
