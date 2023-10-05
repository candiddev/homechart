package types

// ArrayFlatten converts an array of arrays into a single array.
func ArrayFlatten(array []any) []any {
	a := []any{}

	for i := range array {
		switch t := array[i].(type) {
		case []any:
			a = append(a, ArrayFlatten(t)...)
		case any:
			a = append(a, t)
		}
	}

	return a
}
