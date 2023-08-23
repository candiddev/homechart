package models

import (
	"database/sql/driver"
	"encoding/json"
	"sort"
	"strings"

	"github.com/candiddev/shared/go/types"
)

// CookRecipeNote is a note entry for a CookRecipe.
type CookRecipeNote struct {
	Date       types.CivilDate   `db:"date" format:"date" json:"date"`
	Complexity types.ScaleInt    `json:"complexity"`
	Note       types.StringLimit `json:"note"`
	Rating     types.ScaleInt    `json:"rating"`
} // @Name CookRecipeNote

// CookRecipeNotes is multiple CookRecipeNote.
type CookRecipeNotes []CookRecipeNote

// ValidateAndSort checks note entries and sorts them newest to oldest.
func (c *CookRecipeNotes) ValidateAndSort() {
	notes := CookRecipeNotes{}

	for _, note := range *c {
		if (note.Date != types.CivilDate{}) {
			notes = append(notes, note)
		}
	}

	sort.SliceStable(notes, func(a, b int) bool {
		return notes[a].Date.After(notes[b].Date)
	})

	*c = notes
}

// Scan reads in a CookRecipeNotes from a database.
func (c *CookRecipeNotes) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[{`) {
			err := json.Unmarshal(src.([]byte), c)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// Value converts a CooKRecipeNotes to JSON.
func (c CookRecipeNotes) Value() (driver.Value, error) {
	j, err := json.Marshal(c)

	if err == nil && string(j) == "null" {
		return []byte("[]"), err
	}

	return j, err
}
