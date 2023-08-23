package logger

import (
	"math/rand"

	tracesdk "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

type sampler struct {
	ratio float64
}

func (sampler) Description() string {
	return "sampler"
}

func (s sampler) ShouldSample(p tracesdk.SamplingParameters) tracesdk.SamplingResult {
	if b, ok := p.ParentContext.Value("sample").(bool); ok && b || rand.Float64() <= s.ratio { //nolint:gosec
		return tracesdk.SamplingResult{
			Decision:   tracesdk.RecordAndSample,
			Tracestate: trace.SpanContextFromContext(p.ParentContext).TraceState(),
		}
	}

	return tracesdk.SamplingResult{
		Decision:   tracesdk.Drop,
		Tracestate: trace.SpanContextFromContext(p.ParentContext).TraceState(),
	}
}

func newSampler(ratio float64) tracesdk.Sampler {
	switch {
	case ratio >= 1:
		return tracesdk.AlwaysSample()
	case ratio <= 0:
		return tracesdk.NeverSample()
	default:
		return sampler{
			ratio: ratio,
		}
	}
}
