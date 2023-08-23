package get

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

func fileLocal(_ context.Context, src string, dst io.Writer) (time.Time, error) {
	f, err := os.Open(strings.TrimPrefix(src, "file:/"))
	if err != nil {
		return time.Time{}, fmt.Errorf("error opening src: %w", err)
	}

	s, err := f.Stat()
	if err != nil {
		return time.Time{}, fmt.Errorf("error getting stats for src: %w", err)
	}

	if dst != nil {
		if _, err := io.Copy(dst, f); err != nil {
			return time.Time{}, fmt.Errorf("error reading src: %w", err)
		}
	}

	return s.ModTime(), nil
}
