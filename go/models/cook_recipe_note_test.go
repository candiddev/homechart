package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/types"
)

func TestCookRecipeNotesValidateAndSort(t *testing.T) {
	today := types.CivilDateToday()
	nextWeek := today.AddDays(7)
	lastWeek := today.AddDays(-7)

	want := CookRecipeNotes{
		{
			Date: nextWeek,
			Note: "1",
		},
		{
			Date: today,
			Note: "2",
		},
		{
			Date: lastWeek,
			Note: "3",
		},
	}

	got := CookRecipeNotes{
		{
			Date: today,
			Note: "2",
		},
		{
			Note: "4",
		},
		{
			Date: lastWeek,
			Note: "3",
		},
		{
			Date: nextWeek,
			Note: "1",
		},
	}

	got.ValidateAndSort()

	assert.Equal(t, got, want)

	var none CookRecipeNotes

	none.ValidateAndSort()

	assert.Equal(t, none, CookRecipeNotes{})
}
