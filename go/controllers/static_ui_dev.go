//go:build !release

package controllers

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

func (h *Handler) serveUI(w http.ResponseWriter, r *http.Request) {
	if h.Config.App.UIHost == "" {
		static := os.DirFS("web/dist/homechart")
		staticFS := http.FileServer(http.FS(static))

		r.URL.Path = strings.Replace(r.URL.Path, "/", "", 1)

		_, err := static.Open(r.URL.Path)
		if err != nil {
			r.URL.Path = "/"
		}

		staticFS.ServeHTTP(w, r)
	} else {
		origin, _ := url.Parse(h.Config.App.UIHost)

		proxy := &httputil.ReverseProxy{
			Director: func(req *http.Request) {
				req.URL.Scheme = origin.Scheme
				req.URL.Host = origin.Host
			},
		}

		proxy.ServeHTTP(w, r)
	}
}
