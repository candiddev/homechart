package types

import (
	"crypto/rand"
	"math/big"
)

const randCharset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func RandString(length int) string {
	b := make([]byte, length)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(randCharset))))
		b[i] = randCharset[n.Int64()]
	}

	return string(b)
}
