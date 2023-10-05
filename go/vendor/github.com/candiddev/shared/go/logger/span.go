package logger

import (
	"context"
)

// Trace creates a new Span from a context.
func Trace(ctx context.Context) context.Context {
	if Tracer == nil {
		return ctx
	}

	f, _ := getFunc(2)

	ctx, _ = Tracer.Start(ctx, f)

	return ctx
}
