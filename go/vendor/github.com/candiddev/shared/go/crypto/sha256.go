package crypto

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
)

// SHA256File accepts a file and returns the SHA or an error.
func SHA256File(f *os.File) (string, error) {
	s := sha256.New()
	if _, err := io.Copy(s, f); err != nil {
		return "", fmt.Errorf("error creating SHA: %w", err)
	}

	return fmt.Sprintf("%x", s.Sum(nil)), nil
}

// SHA256String accepts a strings and returns the SHA.
func SHA256String(s string) string {
	return fmt.Sprintf("%x", sha256.Sum256([]byte(s)))
}
