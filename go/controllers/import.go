package controllers

import (
	"io"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/parse"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

type importCookRecipe struct {
	AuthHouseholdID uuid.UUID `json:"authHouseholdID"`
	URL             string    `json:"url"`
}

// ImportCookRecipe creates a new CookRecipe by importing from a URL.
func (*Handler) ImportCookRecipe(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var i importCookRecipe

	if err := getJSON(ctx, &i, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Get the response
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, i.URL, nil)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, parse.ErrImportRecipe, err.Error()))

		return
	}

	client := &http.Client{}

	resp, err := client.Do(r)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, parse.ErrImportRecipe, err.Error()))

		return
	}

	defer resp.Body.Close()

	// Read the body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, parse.ErrImportRecipe, err.Error()))

		return
	}

	// Parse the body
	jsonld, e := parse.HTMLToJSONLDRecipe(ctx, string(body))
	if e != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, e))

		return
	}

	// Convert JSON-LD to CookRecipe
	c := jsonld.ToCookRecipe(ctx)
	c.AuthHouseholdID = i.AuthHouseholdID

	// Create the CookRecipe
	WriteResponse(ctx, w, c, nil, 1, "", logger.Log(ctx, models.Create(ctx, c, models.CreateOpts{
		PermissionsOpts: getPermissions(ctx),
	})))
}
