package controllers

import (
	"context"
	"strconv"
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
	r, _ := ctx.Value(authAccountName).(string)

	return r
}

func setAuthAccountName(ctx context.Context, name string) context.Context {
	return context.WithValue(ctx, authAccountName, name)
}

func getAuthSessionAdmin(ctx context.Context) bool {
	b, err := strconv.ParseBool(logger.GetAttribute(ctx, contextAuthSessionAdmin))
	if err == nil && b {
		return b
	}

	return false
}

func setAuthSessionAdmin(ctx context.Context, admin bool) context.Context {
	return logger.SetAttribute(ctx, contextAuthSessionAdmin, strconv.FormatBool(admin))
}

func getAuthSessionID(ctx context.Context) uuid.UUID {
	u, err := uuid.Parse(logger.GetAttribute(ctx, contextAuthSessionID))
	if err == nil && u != uuid.Nil {
		return u
	}

	return uuid.Nil
}

func setAuthSessionID(ctx context.Context, id uuid.UUID) context.Context {
	return logger.SetAttribute(ctx, contextAuthSessionID, id.String())
}

func getChild(ctx context.Context) bool {
	f, _ := ctx.Value(child).(bool)

	return f
}

func setChild(ctx context.Context, f bool) context.Context {
	return context.WithValue(ctx, child, f)
}

func getFilter(ctx context.Context) string {
	r, _ := ctx.Value(filter).(string)

	return r
}

func setFilter(ctx context.Context, s string) context.Context {
	return context.WithValue(ctx, filter, s)
}

func getHash(ctx context.Context) string {
	f, _ := ctx.Value(hash).(string)

	return f
}

func setHash(ctx context.Context, f string) context.Context {
	return context.WithValue(ctx, hash, f)
}

func getOffset(ctx context.Context) int {
	r, _ := ctx.Value(offset).(int)

	return r
}

func setOffset(ctx context.Context, i int) context.Context {
	return context.WithValue(ctx, offset, i)
}

func getPermissions(ctx context.Context) models.PermissionsOpts {
	r, _ := ctx.Value(permissions).(models.PermissionsOpts)

	return r
}

func setPermissions(ctx context.Context, p models.PermissionsOpts) context.Context {
	return context.WithValue(ctx, permissions, p)
}

func getRequestID(ctx context.Context) string {
	return logger.GetAttribute(ctx, contextRequestID)
}

func setRequestID(ctx context.Context, requestID string) context.Context {
	return logger.SetAttribute(ctx, contextRequestID, requestID)
}

func getPublic(ctx context.Context) bool {
	r, _ := ctx.Value(public).(bool)

	return r
}

func setPublic(ctx context.Context) context.Context {
	return context.WithValue(ctx, public, true)
}

func getSubscriptionTrial(ctx context.Context) bool {
	f, _ := ctx.Value(subscriptionTrial).(bool)

	return f
}

func setSubscriptionTrial(ctx context.Context, f bool) context.Context {
	return context.WithValue(ctx, subscriptionTrial, f)
}

func getUpdated(ctx context.Context) time.Time {
	r, _ := ctx.Value(updated).(time.Time)

	return r
}

func setUpdated(ctx context.Context, d time.Time) context.Context {
	return context.WithValue(ctx, updated, d)
}

func getWebPush(ctx context.Context) *notify.WebPushClient {
	f, _ := ctx.Value(webPush).(*notify.WebPushClient)

	return f
}

func setWebPush(ctx context.Context, f *notify.WebPushClient) context.Context {
	return context.WithValue(ctx, webPush, f)
}
