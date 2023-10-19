// Package controllers contains HTTP controllers and routes for Homechart.
package controllers

// @title Homechart
// @version REPLACE
// @description.markdown
// @tag.name Homechart
// @termsOfService https://web.homechart.app/about/terms

// @BasePath /api/v1

// @securityDefinitions.apikey x-homechart-id
// @in header
// @name x-homechart-id

// @securityDefinitions.apikey x-homechart-key
// @in header
// @name x-homechart-key

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/ulule/limiter/v3"
)

const unableToDecode = "Unable to decode response"

// Handler contains variables used by handlers.
type Handler struct {
	Config        *config.Config
	Info          *Info
	OIDCProviders *oidc.Providers
	RateLimiter   *limiter.Limiter
	Router        *chi.Mux
	SSE           *sse
}

// Info contains interesting API information for clients.
type Info struct {
	Cloud        bool     `json:"cloud"`
	Demo         bool     `json:"demo,omitempty"`
	GTMID        string   `json:"gtmID,omitempty"`
	MOTD         string   `json:"motd,omitempty"`
	VAPID        string   `json:"vapid,omitempty"`
	Version      string   `json:"version"`
	FeatureVotes []string `json:"featureVotes,omitempty"`
}

// NewServer returns a new HTTP server.
func NewServer(port int, router http.Handler) *http.Server {
	p := fmt.Sprintf(":%d", port)
	srv := http.Server{
		Addr:              p,
		Handler:           router,
		ReadHeaderTimeout: 60 * time.Second,
	}

	return &srv
}

// ShutdownServer stops a controller gracefully.
func ShutdownServer(ctx context.Context, srv *http.Server, quit chan os.Signal, cancel context.CancelFunc) {
	<-quit
	logger.Error(ctx, nil, "Stopping server") //nolint:errcheck

	srv.SetKeepAlivesEnabled(false)

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("unable to stop server"), err)) //nolint:errcheck
	}

	signal.Stop(quit)

	cancel()
}

// Listen starts a web server on a port and returns an error.
func (h *Handler) Listen(ctx context.Context, srv *http.Server) errs.Err {
	ctx = logger.Trace(ctx)

	var err error

	h.SSE = newSSE()
	go h.SSE.Listen(ctx, &h.Config.PostgreSQL)

	logger.Info(ctx, "Starting server...")

	if h.Config.App.TLSCertificate != "" {
		err = srv.ListenAndServeTLS(h.Config.App.TLSCertificate, h.Config.App.TLSKey)
	} else {
		err = srv.ListenAndServe()
	}

	if err != nil && err != http.ErrServerClosed {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	return nil
}

// DecodeResponse decodes an API response to a msg and a dataValue.
func DecodeResponse(body io.Reader, dataValue any) (*Response, error) {
	var data json.RawMessage

	r := &Response{
		DataValue: &data,
	}

	b, err := io.ReadAll(body)
	if err != nil || len(b) == 0 {
		return r, nil
	}

	err = json.Unmarshal(b, r)
	if err != nil {
		r.Message = unableToDecode

		return r, err
	}

	err = json.Unmarshal(data, dataValue)
	if err != nil {
		return r, err
	}

	return r, nil
}

func getJSON(ctx context.Context, i any, b io.Reader) errs.Err {
	d := json.NewDecoder(b)

	var err errs.Err

	if errr := d.Decode(i); errr != nil {
		if e, ok := errr.(errs.Err); ok {
			err = e
		} else {
			err = errs.ErrSenderBadRequest.Wrap(errr)
		}

		return logger.Error(ctx, err)
	}

	return nil
}

func getInt(r *http.Request, param string) int {
	i, err := strconv.Atoi(chi.URLParam(r, param))
	if err != nil {
		return 0
	}

	return i
}

func getTimestamp(input string) time.Time {
	t, err := time.Parse(time.RFC3339Nano, input)
	if err != nil {
		return time.Time{}
	}

	return t
}

func getUUID(r *http.Request, param string) uuid.UUID {
	return models.ParseUUID(chi.URLParam(r, param))
}
