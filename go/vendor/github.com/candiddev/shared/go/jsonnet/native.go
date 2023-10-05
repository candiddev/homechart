package jsonnet

import _ "embed"

// Native contains native Jsonnet functions.
//
//go:embed native.libsonnet
var Native string
