package types

import "encoding/json"

func JSONToString(i any) string {
	j, err := json.MarshalIndent(i, "", "  ")
	if err == nil {
		return string(j)
	}

	return ""
}
