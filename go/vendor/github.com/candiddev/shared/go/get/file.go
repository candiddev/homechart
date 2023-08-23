package get

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

// File gets a file from src and writes it to dst.  If lastModified is supplied, it will be used to ensure the file isn't copied twice.  Returns a non-zero newLastModified if the file has changed.
func File(ctx context.Context, src string, dst io.Writer, lastModified time.Time) (newLastModified time.Time, err error) {
	switch {
	case strings.HasPrefix(src, "http"):
		return fileHTTP(ctx, src, dst, lastModified)
	default:
		return fileLocal(ctx, src, dst)
	}
}

// FileCache gets a file from src and writes it to dst, caching it to cachePath.
func FileCache(ctx context.Context, src string, dst io.Writer, cachePath string) error {
	cb := bytes.Buffer{}

	lastModified := time.Time{}

	// Get cache file if exists
	if strings.HasPrefix(src, "http") {
		lastModified, _ = File(ctx, cachePath, &cb, time.Time{})
	}

	b := bytes.Buffer{}

	lastModified, err := File(ctx, src, &b, lastModified)
	if err != nil {
		return fmt.Errorf("error opening src: %w", err)
	}

	if b.Len() != 0 {
		if strings.HasPrefix(src, "http") {
			if err := os.WriteFile(cachePath, b.Bytes(), 0600); err != nil {
				return fmt.Errorf("error caching file: %w", err)
			}

			if err := os.Chtimes(cachePath, lastModified, lastModified); err != nil {
				return fmt.Errorf("error setting mode on cache file: %w", err)
			}
		}

		if _, err := dst.Write(b.Bytes()); err != nil {
			return fmt.Errorf("reading file: %w", err)
		}
	} else if cb.Len() != 0 {
		if _, err := dst.Write(cb.Bytes()); err != nil {
			return fmt.Errorf("reading file: %w", err)
		}
	}

	return nil
}
