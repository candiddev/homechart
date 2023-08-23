//go:build !release

package controllers

import (
	"os"
)

//nolint:gochecknoglobals
var staticSwagger = os.DirFS("go/homechart/controllers")
