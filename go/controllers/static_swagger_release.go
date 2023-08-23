//go:build release
// +build release

package controllers

import "embed"

//go:embed swagger.yaml

// nolint:gochecknoglobals
var staticSwagger embed.FS
