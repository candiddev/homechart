//go:build release
// +build release

package controllers

import (
	"embed"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"strings"
)

//go:embed ui/*

// nolint:gochecknoglobals
var staticUI embed.FS

type spaFS struct {
	root http.FileSystem
}

type notFoundWriter struct {
	w http.ResponseWriter
}

func (rw notFoundWriter) Header() http.Header {
	return rw.w.Header()
}

func (rw notFoundWriter) WriteHeader(status int) {
	if status == http.StatusNotFound {
		rw.w.Header().Set("Cache-Control", "no-store")
		rw.w.Header().Set("CDN-Cache-Control", "no-store")
	}

	rw.w.WriteHeader(status)
}

func (rw notFoundWriter) Write(b []byte) (int, error) {
	if rw.w != nil {
		return rw.w.Write(b)
	}

	return len(b), nil
}

func (fs *spaFS) Open(name string) (http.File, error) {
	f, err := fs.root.Open(name)
	if errors.Is(err, os.ErrNotExist) && !strings.HasPrefix(name, "/assets") {
		return fs.root.Open("index.html")
	}

	return f, err
}

// serveUI reads UI files from an embedded build.
func (h *Handler) serveUI(w http.ResponseWriter, r *http.Request) {
	fsUI, _ := fs.Sub(staticUI, "ui")

	http.FileServer(&spaFS{
		root: http.FS(fsUI),
	}).ServeHTTP(notFoundWriter{
		w: w,
	}, r)
}
