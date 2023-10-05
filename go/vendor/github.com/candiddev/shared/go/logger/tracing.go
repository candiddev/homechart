package logger

import (
	"context"
	"errors"
	"os"
	"runtime"

	"github.com/candiddev/shared/go/errs"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.10.0"
	"go.opentelemetry.io/otel/trace"
)

var ErrOTLPTraceInit = errors.New("error initializing OTLP client")

// TracingConfig configures Tracing.
type TracingConfig struct {
	Endpoint     string  `json:"endpoint,omitempty"`
	Path         string  `json:"path,omitempty"`
	SamplerRatio float64 `json:"samplerRatio,omitempty"`
	ServiceName  string  `json:"serviceName,omitempty"`
	Insecure     bool    `json:"insecure,omitempty"`
}

// Tracer is an OpenTelemetry tracer.
var Tracer trace.Tracer //nolint:gochecknoglobals

// SetupTracing initializes an OTLP GlobalTracer.
func SetupTracing(ctx context.Context, cfg TracingConfig, baseURL, version string) (*tracesdk.TracerProvider, errs.Err) {
	opts := []otlptracehttp.Option{
		otlptracehttp.WithEndpoint(cfg.Endpoint),
	}

	if cfg.Insecure {
		opts = append(opts, otlptracehttp.WithInsecure())
	}

	if cfg.Path != "" {
		opts = append(opts, otlptracehttp.WithURLPath(cfg.Path))
	}

	client := otlptracehttp.NewClient(opts...)

	exporter, err := otlptrace.New(ctx, client)
	if err != nil {
		return nil, Error(ctx, errs.ErrReceiver.Wrap(ErrOTLPTraceInit, err))
	}

	hostname, _ := os.Hostname()

	tp := tracesdk.NewTracerProvider(
		tracesdk.WithBatcher(exporter),
		tracesdk.WithSampler(newSampler(cfg.SamplerRatio)),
		tracesdk.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.HostArchKey.String(runtime.GOARCH),
			semconv.HostNameKey.String(hostname),
			semconv.OSTypeKey.String(runtime.GOOS),
			semconv.ServiceNameKey.String(cfg.ServiceName),
			semconv.ServiceVersionKey.String(version),
			semconv.ServiceInstanceIDKey.String(uuid.New().String()),
			attribute.String("url", baseURL),
		)),
	)

	otel.SetTracerProvider(tp)
	Tracer = tp.Tracer(cfg.ServiceName)

	return tp, Error(ctx, nil)
}
