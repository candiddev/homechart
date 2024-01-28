package models

import (
	"context"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

type key int

const (
	iso639Code key = iota
)

const (
	contextAuthAccountID = "authAccountID"
)

// GetAuthAccountID returns the AuthAccountID attribute.
func GetAuthAccountID(ctx context.Context) uuid.UUID {
	return logger.GetAttribute[uuid.UUID](ctx, contextAuthAccountID)
}

// SetAuthAccountID sets the AuthAccountID attribute.
func SetAuthAccountID(ctx context.Context, id uuid.UUID) context.Context {
	return logger.SetAttribute(ctx, contextAuthAccountID, id)
}

// GetISO639Code returns the ISO639Code attribute.
func GetISO639Code(ctx context.Context) yaml8n.ISO639Code {
	if f, ok := ctx.Value(iso639Code).(yaml8n.ISO639Code); ok {
		return f
	}

	return ""
}

// SetISO639Code sets the ISO639Code attribute.
func SetISO639Code(ctx context.Context, f yaml8n.ISO639Code) context.Context {
	return context.WithValue(ctx, iso639Code, f)
}
