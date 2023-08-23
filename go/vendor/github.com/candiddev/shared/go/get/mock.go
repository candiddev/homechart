package get

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"time"
)

// HTTPMock is used for mocking get requests.
type HTTPMock struct {
	requests             []HTTPMockRequest
	mux                  *sync.Mutex
	server               *httptest.Server
	responseBody         []byte
	responseLastModified time.Time
	responsePaths        []string
}

// HTTPMockRequest is a mock request sent to HTTPMock.
type HTTPMockRequest struct {
	Headers http.Header
	Path    string
	Status  int
}

// NewHTTPMock creates a mock for performing GET requests.
func NewHTTPMock(paths []string, body []byte, lastModified time.Time) *HTTPMock {
	h := &HTTPMock{
		mux:           &sync.Mutex{},
		responseBody:  body,
		responsePaths: paths,
	}

	h.responseLastModified = lastModified
	h.server = httptest.NewServer(http.HandlerFunc(h.handler))

	return h
}

func (h *HTTPMock) handler(w http.ResponseWriter, r *http.Request) {
	h.mux.Lock()
	defer h.mux.Unlock()

	r.Header.Del("User-Agent")
	r.Header.Del("Accept-Encoding")

	req := HTTPMockRequest{
		Headers: r.Header,
		Path:    r.URL.Path,
	}

	match := false

	for i := range h.responsePaths {
		if h.responsePaths[i] == r.URL.Path {
			match = true

			break
		}
	}

	if !match {
		w.WriteHeader(http.StatusNotFound)
		req.Status = http.StatusNotFound
		h.requests = append(h.requests, req)

		return
	}

	if str := r.Header.Get("If-Modified-Since"); str == h.responseLastModified.Format(http.TimeFormat) {
		w.WriteHeader(http.StatusNotModified)
		req.Status = http.StatusNotModified
		h.requests = append(h.requests, req)

		return
	}

	req.Status = http.StatusOK
	h.requests = append(h.requests, req)

	w.Header().Add("content-type", http.DetectContentType(h.responseBody))
	w.Header().Add("last-modified", h.responseLastModified.Format(http.TimeFormat))

	w.Write(h.responseBody) //nolint:errcheck
}

// LastModified returns the last modified header for the last request.
func (h *HTTPMock) LastModified() time.Time {
	h.mux.Lock()
	defer h.mux.Unlock()

	return h.responseLastModified.Truncate(time.Second)
}

// LastModifiedHeader returns the last modified header for the last request as a string.
func (h *HTTPMock) LastModifiedHeader() string {
	h.mux.Lock()
	defer h.mux.Unlock()

	return h.responseLastModified.Format(http.TimeFormat)
}

// Requests returns a list of all requests made to the mock.
func (h *HTTPMock) Requests() []HTTPMockRequest {
	h.mux.Lock()
	defer h.mux.Unlock()

	req := h.requests
	h.requests = nil

	return req
}

// Close ends the mock.
func (h *HTTPMock) Close() {
	h.mux.Lock()
	defer h.mux.Unlock()

	h.server.Close()
}

// URL returns the listening URL of the mock.
func (h *HTTPMock) URL() string {
	h.mux.Lock()
	defer h.mux.Unlock()

	return h.server.URL
}
