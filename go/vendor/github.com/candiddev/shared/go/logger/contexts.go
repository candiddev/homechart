package logger

import (
	"context"
	"strings"
)

type contextKey string

// Context attributes.
const (
	AttributeDebug      = "debug"
	AttributeMethod     = "method"
	AttributePath       = "path"
	AttributeRemoteAddr = "remoteAddr"
)

// GetAttribute gets a ma[string]string value for a key.
func GetAttribute(ctx context.Context, key string) string {
	s, ok := ctx.Value(contextKey(key)).(string)
	if !ok {
		return ""
	}

	return s
}

// SetAttribute sets a value for a key.
func SetAttribute(ctx context.Context, key, value string) context.Context {
	ctx = context.WithValue(ctx, contextKey(key), value)

	keys := GetAttribute(ctx, "keys")
	if !strings.Contains(keys, key) {
		if keys != "" {
			keys += ","
		}

		keys += key
		ctx = context.WithValue(ctx, contextKey("keys"), keys)
	}

	return ctx
}

// GetDebug for log entry.
func GetDebug(ctx context.Context) bool {
	if v, ok := ctx.Value(contextKey(AttributeDebug)).(bool); ok && v {
		return true
	}

	return false
}

// SetDebug for log entry.
func SetDebug(ctx context.Context, d bool) context.Context {
	return context.WithValue(ctx, contextKey(AttributeDebug), d)
}
