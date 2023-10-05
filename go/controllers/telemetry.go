package controllers

import (
	"io"
	"net/http"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
)

type telemetryError struct {
	Error   string `json:"error"`
	Path    string `json:"path"`
	Version string `json:"version"`
}

// TelemetryErrorCreate takes in metrics from clients.
func (h *Handler) TelemetryErrorCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var t telemetryError

	_ = getJSON(ctx, &t, r.Body)

	if t.Path != "" && t.Error != "" && t.Version == h.Info.Version {
		metrics.TelemetryErrorTotal.WithLabelValues(t.Path, t.Version).Add(1)
		ctx = logger.SetAttribute(ctx, "path", t.Path)
		ctx = logger.SetAttribute(ctx, "method",
			"GET")
		logger.Error(ctx, errs.ErrReceiver, t.Error) //nolint:errcheck
	}

	w.WriteHeader(http.StatusNoContent)
}

// TelemetryTraceCreate takes in traces from clients.
func (h *Handler) TelemetryTraceCreate(w http.ResponseWriter, r *http.Request) {
	if h.Config.Tracing.Endpoint == "" {
		http.NotFoundHandler().ServeHTTP(w, r)

		return
	}

	ctx := r.Context()

	tracer := "https://"

	if h.Config.Tracing.Insecure {
		tracer = "http://"
	}

	tracer += h.Config.Tracing.Endpoint

	if h.Config.Tracing.Path == "" {
		tracer += "/v1/traces"
	} else {
		tracer += h.Config.Tracing.Path
	}

	r, err := http.NewRequestWithContext(r.Context(), r.Method, tracer, r.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrReceiver.Wrap(err)))

		return
	}

	r.Header.Add("content-type", "application/json")

	client := &http.Client{}

	res, err := client.Do(r)
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(err)) //nolint:errcheck
		w.WriteHeader(http.StatusNotFound)

		return
	}

	defer res.Body.Close()

	w.WriteHeader(res.StatusCode)

	_, err = io.Copy(w, res.Body)
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

		return
	}
}
