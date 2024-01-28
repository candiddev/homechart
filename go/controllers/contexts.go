package controllers

import (
	"context"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/google/uuid"
)

type key int

const (
	authAccountName key = iota
	child
	filter
	hash
	offset
	permissions
	public
	subscriptionTrial
	updated
	webPush
)

const (
	contextAuthSessionAdmin = "authSessionAdmin"
	contextAuthSessionID    = "authSessionID"
	contextRequestID        = "requestID"
)

func getAuthAccountName(ctx context.Context) string {
	if r, ok := ctx.Value(authAccountName).(string); ok {
		return r
	}

	return ""
}

func setAuthAccountName(ctx context.Context, name string) context.Context {
	return context.WithValue(ctx, authAccountName, name)
}

func getAuthSessionAdmin(ctx context.Context) bool {
	return logger.GetAttribute[bool](ctx, contextAuthSessionAdmin)
}

func setAuthSessionAdmin(ctx context.Context, admin bool) context.Context {
	return logger.SetAttribute(ctx, contextAuthSessionAdmin, admin)
}

func getAuthSessionID(ctx context.Context) uuid.UUID {
	return logger.GetAttribute[uuid.UUID](ctx, contextAuthSessionID)
}

func setAuthSessionID(ctx context.Context, id uuid.UUID) context.Context {
	return logger.SetAttribute(ctx, contextAuthSessionID, id)
}

func getChild(ctx context.Context) bool {
	if f, ok := ctx.Value(child).(bool); ok {
		return f
	}

	return false
}

func setChild(ctx context.Context, f bool) context.Context {
	return context.WithValue(ctx, child, f)
}

func getFilter(ctx context.Context) string {
	if r, ok := ctx.Value(filter).(string); ok {
		return r
	}

	return ""
}

func setFilter(ctx context.Context, s string) context.Context {
	return context.WithValue(ctx, filter, s)
}

func getHash(ctx context.Context) string {
	if f, ok := ctx.Value(hash).(string); ok {
		return f
	}

	return ""
}

func setHash(ctx context.Context, f string) context.Context {
	return context.WithValue(ctx, hash, f)
}

func getOffset(ctx context.Context) int {
	if r, ok := ctx.Value(offset).(int); ok {
		return r
	}

	return 0
}

func setOffset(ctx context.Context, i int) context.Context {
	return context.WithValue(ctx, offset, i)
}

func getPermissions(ctx context.Context) models.PermissionsOpts {
	if r, ok := ctx.Value(permissions).(models.PermissionsOpts); ok {
		return r
	}

	return models.PermissionsOpts{}
}

func setPermissions(ctx context.Context, p models.PermissionsOpts) context.Context {
	return context.WithValue(ctx, permissions, p)
}

func getRequestID(ctx context.Context) string {
	return logger.GetAttribute[string](ctx, contextRequestID)
}

func setRequestID(ctx context.Context, requestID string) context.Context {
	return logger.SetAttribute(ctx, contextRequestID, requestID)
}

func getPublic(ctx context.Context) bool {
	if r, ok := ctx.Value(public).(bool); ok {
		return r
	}

	return false
}

func setPublic(ctx context.Context) context.Context {
	return context.WithValue(ctx, public, true)
}

func getSubscriptionTrial(ctx context.Context) bool {
	if f, ok := ctx.Value(subscriptionTrial).(bool); ok {
		return f
	}

	return false
}

func setSubscriptionTrial(ctx context.Context, f bool) context.Context {
	return context.WithValue(ctx, subscriptionTrial, f)
}

func getUpdated(ctx context.Context) time.Time {
	if r, ok := ctx.Value(updated).(time.Time); ok {
		return r
	}

	return time.Time{}
}

func setUpdated(ctx context.Context, d time.Time) context.Context {
	return context.WithValue(ctx, updated, d)
}

func getWebPush(ctx context.Context) *notify.WebPushClient {
	if f, ok := ctx.Value(webPush).(*notify.WebPushClient); ok {
		return f
	}

	return nil
}

func setWebPush(ctx context.Context, f *notify.WebPushClient) context.Context {
	return context.WithValue(ctx, webPush, f)
}
