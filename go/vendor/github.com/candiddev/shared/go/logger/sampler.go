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
	decision := tracesdk.Drop

	for i := range p.Attributes {
		if p.Attributes[i].Key == "level" && p.Attributes[i].Value.AsString() != string(LevelDebug) {
			decision = tracesdk.RecordAndSample

			break
		}
	}

	if decision == tracesdk.Drop && rand.Float64() <= s.ratio { //nolint:gosec
		decision = tracesdk.RecordAndSample
	}

	return tracesdk.SamplingResult{
		Decision:   decision,
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
