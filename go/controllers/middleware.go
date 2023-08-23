package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/candiddev/shared/go/types"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/trace"
)

var uuidRegex = regexp.MustCompile(`\w{8}(?:-\w{4}){3}-\w{12}`)

func failAuthorization(ctx context.Context, _ *http.Request, w http.ResponseWriter) errs.Err {
	var res any

	header := 200

	if res != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(header)

		j, err := json.Marshal(&res)
		if err != nil {
			logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck
		}

		_, err = w.Write(j)
		if err != nil {
			logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck
		}

		return errs.ErrClientGone
	}

	WriteResponse(ctx, w, nil, nil, 0, "", errs.ErrClientGone)

	return errs.ErrClientGone
}

func parseOAuthHeader(ctx context.Context, r *http.Request) (selfHostedID, id, key uuid.UUID) {
	// The accessToken should have the format of AuthSession.ID_AuthSession.Key
	authParts := strings.Split(r.Header.Get("Authorization"), " ")
	if len(authParts) != 2 {
		logger.Log(ctx, errClientBadRequestOAuth, "authorization format invalid") //nolint:errcheck

		return selfHostedID, id, key
	}

	logger.Log(ctx, nil) //nolint:errcheck

	return parseOAuthToken(ctx, authParts[1])
}

func parseOAuthToken(ctx context.Context, token string) (selfHostedID, id, key uuid.UUID) {
	keyParts := strings.Split(token, "_")
	if len(keyParts) != 3 {
		logger.Log(ctx, errClientBadRequestOAuth, "token format invalid") //nolint:errcheck

		return selfHostedID, id, key
	}

	logger.Log(ctx, nil) //nolint:errcheck

	return models.ParseUUID(keyParts[0]), models.ParseUUID(keyParts[1]), models.ParseUUID(keyParts[2])
}

func (*Handler) proxySelfHostedRequest(ctx context.Context, w http.ResponseWriter, r *http.Request, selfHostedID *uuid.NullUUID) {
	ctx = logger.Trace(ctx)

	ah := models.AuthHousehold{
		SelfHostedID: selfHostedID,
	}

	if err := ah.Read(ctx); err != nil {
		err := failAuthorization(ctx, r, w)
		logger.Log(ctx, err) //nolint:errcheck

		return
	}

	if ah.IsExpired() {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientPaymentRequired))

		return
	}

	if ah.SelfHostedURL == "" {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

		return
	}

	pr, err := http.NewRequestWithContext(ctx, r.Method, fmt.Sprintf("%s%s", ah.SelfHostedURL, r.RequestURI), r.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errServerProxyURL, err.Error()))

		return
	}

	pr.Header = r.Header

	client := &http.Client{}

	res, err := client.Do(pr)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errServerProxyURL, err.Error()))

		return
	}

	defer res.Body.Close()

	w.Header().Set("content-type", "application/json")
	w.WriteHeader(res.StatusCode)

	_, err = io.Copy(w, res.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errServerProxyURL, err.Error()))

		return
	}

	logger.Log(ctx, nil) //nolint:errcheck
}

// CheckAdmin verifies a session is admin.
func (*Handler) CheckAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())

		if !getPermissions(ctx).Admin {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

			return
		}

		logger.Log(ctx, nil) //nolint:errcheck
		next.ServeHTTP(w, r)
	})
}

// CheckSession verifies session exists.
func (h *Handler) CheckSession(next http.Handler) http.Handler { //nolint:gocognit
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sctx := logger.Trace(r.Context())
		ctx := r.Context()

		var s models.AuthSession
		var selfHostedID uuid.UUID

		// Get session
		switch {
		case r.Header.Get("Authorization") != "":
			if h.Config.OAuth.TestID != "" {
				s.ID = models.ParseUUID(h.Config.OAuth.TestID)
				s.Key = models.ParseUUID(h.Config.OAuth.TestKey)
			} else {
				selfHostedID, s.ID, s.Key = parseOAuthHeader(ctx, r)
			}
		case r.Header.Get("x-homechart-id") != "":
			s.ID = models.ParseUUID(r.Header.Get("x-homechart-id"))
			s.Key = models.ParseUUID(r.Header.Get("x-homechart-key"))
		case h.Config.App.ProxyAddress != "" && strings.HasPrefix(r.RemoteAddr, h.Config.App.ProxyAddress):
			if emailAddress := r.Header.Get(h.Config.App.ProxyHeaderEmail); emailAddress != "" {
				a := models.AuthAccount{
					EmailAddress: types.EmailAddress(emailAddress),
					Name:         types.StringLimit(r.Header.Get(h.Config.App.ProxyHeaderName)),
				}

				err := a.ReadPasswordHash(ctx)
				if err == nil {
					as, err := h.createAuthSession(ctx, r, &a)
					if err == nil {
						s = as
					}
				} else if errors.Is(err, errs.ErrClientBadRequestMissing) {
					as, err := h.createAuthAccount(ctx, r, &a, false)
					if err == nil {
						s = as
					}
				}
			}
		}

		if h.Info.Cloud && selfHostedID != uuid.Nil {
			h.proxySelfHostedRequest(ctx, w, r, types.UUIDToNullUUID(selfHostedID))

			return
		}

		// Check if session is valid
		if s.ID == uuid.Nil || s.Key == uuid.Nil {
			err := failAuthorization(ctx, r, w)
			logger.Log(ctx, err) //nolint:errcheck

			return
		}

		// Check if session exists
		if err := s.Read(ctx, false); err != nil {
			err := failAuthorization(ctx, r, w)
			logger.Log(ctx, err) //nolint:errcheck

			return
		}

		// Check counts
		ah := getUUID(r, "auth_household_id")

		// Check if session is admin, else if the paths match.
		if !s.Admin && ((getUUID(r, "auth_account_id") != uuid.Nil && getUUID(r, "auth_account_id") != s.AuthAccountID) || (!strings.Contains(r.URL.Path, "invites") && ah != uuid.Nil && s.PermissionsHouseholds.Get(&ah) == nil)) {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

			return
		}

		sctx = setAuthSessionAdmin(sctx, s.Admin)
		sctx = models.SetAuthAccountID(sctx, s.AuthAccountID)
		sctx = setAuthSessionID(sctx, s.ID)
		logger.Log(sctx, nil) //nolint:errcheck

		ctx = models.SetAuthAccountID(ctx, s.AuthAccountID)
		ctx = setAuthSessionAdmin(ctx, s.Admin)
		ctx = setAuthSessionID(ctx, s.ID)
		ctx = setAuthAccountName(ctx, s.AuthAccountName)
		ctx = setChild(ctx, s.Child)
		ctx = setWebPush(ctx, s.WebPush)
		ctx = models.SetISO639Code(ctx, s.ISO639Code)
		ctx = setPermissions(ctx, models.PermissionsOpts{
			Admin:                     s.Admin,
			AuthAccountID:             &s.AuthAccountID,
			AuthAccountPermissions:    &s.PermissionsAccount,
			AuthHouseholdsPermissions: &s.PermissionsHouseholds,
		})

		logger.Log(ctx, nil) //nolint:errcheck
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CheckSystemAuth checks authorization headers for health and metrics.
func (h *Handler) CheckSystemAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())

		key := r.URL.Query().Get("key")

		var allow bool

		switch r.URL.Path {
		case "/api/v1/system/config":
			allow = h.Config.App.SystemConfigKey != "" && key == h.Config.App.SystemConfigKey
		case "/api/v1/system/health":
			allow = h.Config.App.SystemHealthKey != "" && key == h.Config.App.SystemHealthKey
		case "/api/v1/system/metrics":
			allow = h.Config.App.SystemMetricsKey != "" && key == h.Config.App.SystemMetricsKey
		case "/api/v1/system/stop":
			allow = h.Config.App.SystemStopKey != "" && key == h.Config.App.SystemStopKey
		}

		if strings.HasPrefix(r.URL.Path, "/api/v1/system/pprof") {
			allow = h.Config.App.SystemPprofKey != "" && key == h.Config.App.SystemPprofKey
		}

		if !allow {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

			return
		}

		logger.Log(ctx, nil) //nolint:errcheck
		next.ServeHTTP(w, r)
	})
}

// GetFilter retrieves the filter query string.
func (*Handler) GetFilter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())
		logger.Log(ctx, nil) //nolint:errcheck
		ctx = r.Context()
		ctx = setFilter(ctx, r.URL.Query().Get("filter"))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetCacheHeaders retrieves useful headers for caching.
func (*Handler) GetCacheHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())
		logger.Log(ctx, nil) //nolint:errcheck
		ctx = r.Context()
		ctx = setUpdated(ctx, getTimestamp(r.Header.Get(("x-homechart-updated"))))
		ctx = setHash(ctx, r.Header.Get("x-homechart-hash"))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetOffset retrieves the offset query string.
func (*Handler) GetOffset(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())
		offset := r.URL.Query().Get("offset")
		o, err := strconv.Atoi(offset)
		if offset != "" && err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

			return
		}

		logger.Log(ctx, nil) //nolint:errcheck
		ctx = r.Context()
		ctx = setOffset(ctx, o)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetSession retrieves a session from the database.
func (*Handler) GetSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())

		var s models.AuthSession

		// Get session
		c, err := r.Cookie("ID")
		if err != nil {
			s.ID = models.ParseUUID(r.Header.Get("x-homechart-id"))
		} else {
			s.ID = models.ParseUUID(c.Value)
		}

		c, err = r.Cookie("Key")
		if err != nil {
			s.Key = models.ParseUUID(r.Header.Get("x-homechart-key"))
		} else {
			s.Key = models.ParseUUID(c.Value)
		}

		logger.Log(ctx, nil) //nolint:errcheck
		ctx = r.Context()

		// Check if session is valid
		if s.ID != uuid.Nil && s.Key != uuid.Nil {
			// Check if session exists
			err := s.Read(ctx, false)

			if err == nil && s.ID != uuid.Nil && s.AuthAccountID != uuid.Nil {
				ctx = models.SetAuthAccountID(ctx, s.AuthAccountID)
				ctx = setAuthSessionAdmin(ctx, s.Admin)
				ctx = setAuthSessionID(ctx, s.ID)
				ctx = setPermissions(ctx, models.PermissionsOpts{
					AuthAccountID:             &s.AuthAccountID,
					AuthAccountPermissions:    &s.PermissionsAccount,
					AuthHouseholdsPermissions: &s.PermissionsHouseholds,
				})
			}
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// SetCacheControl sets the cache-control header.
func (h *Handler) SetCacheControl(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.RequestURI, "/assets") || strings.Contains(r.RequestURI, "/homechart_") {
			w.Header().Set("Cache-Control", h.Config.App.CacheControl)
			w.Header().Set("CDN-Cache-Control", h.Config.App.CacheControl)
		} else {
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("CDN-Cache-Control", "no-store")
		}
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r)

		if ww.Status() == 404 {
			w.Header().Set("Cache-Control", "no-store")
			w.Header().Set("CDN-Cache-Control", "no-store")
		}
	})
}

// SetCORS sets CORS responses.
func (*Handler) SetCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "content-type, x-homechart-debug, x-homechart-hash, x-homechart-id, x-homechart-key, x-homechart-updated, x-homechart-version")
			w.Header().Set("Access-Control-Allow-Methods", "*")

			return
		}
		next.ServeHTTP(w, r)
	})
}

// SetContentType sets the content-type to JSON.
func (*Handler) SetContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

// SetPublic sets the public context.
func (*Handler) SetPublic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())
		logger.Log(ctx, nil) //nolint:errcheck
		ctx = r.Context()
		ctx = setPublic(ctx)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// SetRequestContext adds additional context to requests.
func (h *Handler) SetRequestContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ctx = logger.SetDebug(ctx, h.Config.App.Debug)
		if r.URL.Query().Get("debug") != "" || r.Header.Get("x-homechart-debug") != "" {
			ctx = logger.SetDebug(ctx, true)
		}
		ctx = logger.SetAttribute(ctx, logger.AttributeRemoteAddr, h.RateLimiter.GetIPKey(r))
		ctx = logger.SetAttribute(ctx, logger.AttributeMethod, r.Method)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// SetTracingContext adds tracing context.
func (*Handler) SetTracingContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.Split(r.URL.Path, "?")[0]

		ctx := r.Context()

		if logger.Tracer != nil {
			var span trace.Span

			ctx, span = logger.Tracer.Start(ctx, fmt.Sprintf("%s %s", path, r.Method))
			ctx = setRequestID(ctx, span.SpanContext().SpanID().String())
		} else {
			ctx = setRequestID(ctx, string(types.NewNanoid()))
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// SessionMetrics writes metrics for each page.
func (*Handler) SessionMetrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := uuidRegex.ReplaceAllString(r.URL.Path, ":id")
		ctx := logger.SetAttribute(r.Context(), logger.AttributePath, path)
		t := models.GenerateTimestamp()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r.WithContext(ctx))

		if !strings.Contains(path, "/sse") && !strings.Contains(path, "/system") && !strings.Contains(path, "/telemetry") {
			metrics.ControllerRequestTotal.WithLabelValues(path, r.Method, strconv.Itoa(ww.Status())).Add(1)
			metrics.ControllerRequestDuration.WithLabelValues(path, r.Method).Observe(time.Since(t).Seconds())
			metrics.ControllerRequestSize.WithLabelValues(path, r.Method).Observe(float64(r.ContentLength))
			metrics.ControllerResponseSize.WithLabelValues(path, r.Method).Observe(float64(ww.BytesWritten()))
			metrics.ControllerUserAgentTotal.WithLabelValues(r.UserAgent()).Add(1)
		}
	})
}
