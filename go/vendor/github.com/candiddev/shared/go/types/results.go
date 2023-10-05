package types

import (
	"fmt"
	"sort"
	"strings"
)

// Results is a map of strings.
type Results map[string][]string

// Show returns a list of results for each map key.
func (l Results) Show() []string {
	keys := make([]string, len(l))
	out := []string{}

	i := 0

	for a := range l {
		keys[i] = a
		i++
	}

	sort.Strings(keys)

	for i := range keys {
		out = append(out, fmt.Sprintf("%s:\n\t%s", keys[i], strings.Join(l[keys[i]], "\n\t")))
	}

	return out
}
