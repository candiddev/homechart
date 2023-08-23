package controllers

import (
	"net/http"

	"github.com/candiddev/shared/go/metrics"
	"github.com/candiddev/shared/go/types"
)

type analyticsEvent int

const (
	analyticsEventInit analyticsEvent = iota
	analyticsEventPurchase
	analyticsEventSignUp
)

func (h *Handler) sendAnalytics(e analyticsEvent, userAgent types.UserAgent, r *http.Request) {
	if h.Info.Cloud {
		var event string

		version := r.Header.Get("x-homechart-version")

		switch e {
		case analyticsEventInit:
			event = "init"
		case analyticsEventPurchase:
			event = "purchase"
		case analyticsEventSignUp:
			event = "signup"
		}

		metrics.ControllerEventTotal.WithLabelValues(event, string(userAgent), version).Add(1)
	}
}
