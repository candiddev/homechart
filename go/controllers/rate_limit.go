package controllers

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// InitRateLimiter configures a new Rate Limiter.
func (h *Handler) InitRateLimiter(ctx context.Context) {
	rate, err := limiter.NewRateFromFormatted(h.Config.App.RateLimiterRate)
	if err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck
		panic(err)
	}

	store := memory.NewStore()

	h.RateLimiter = limiter.New(store, rate, limiter.WithTrustForwardHeader(true))
}

// CheckRateLimiter checks a session against the rate limiter.
func (h *Handler) CheckRateLimiter(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := logger.Trace(r.Context())
		key := h.RateLimiter.GetIPKey(r) + chi.RouteContext(ctx).RoutePattern()

		var err error

		var limit limiter.Context

		post := strings.HasPrefix(r.URL.Path, "/api/v1/system") || strings.HasPrefix(r.URL.Path, "/api/v1/sse")

		if post {
			limit, err = h.RateLimiter.Peek(ctx, key)
		} else {
			limit, err = h.RateLimiter.Get(ctx, key)
		}

		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.NewServerErr(err)))

			return
		}

		w.Header().Add("x-rate-limit-limit", strconv.Itoa(int(limit.Limit)))
		w.Header().Add("x-rate-limit-remaining", strconv.Itoa(int(limit.Remaining)))
		w.Header().Add("x-rate-limit-reset", strconv.Itoa(int(limit.Reset)))

		if limit.Reached && h.Config.App.RateLimiterKey != r.Header.Get("x-homechart-ratelimiterkey") {
			logger.LogNotice(noticeRateLimited, key)
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientTooManyRequests))

			return
		}

		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
		next.ServeHTTP(ww, r.WithContext(ctx))

		if post && ww.Status() > 299 && ww.Status() < 500 {
			_, err := h.RateLimiter.Get(ctx, key)
			if err != nil {
				logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

				return
			}
		}
	})
}
