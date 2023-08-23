package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"reflect"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// Response is an API response.
type Response struct { //nolint:errname
	DataIDs   []models.ID `json:"dataIDs"`
	DataValue any         `json:"dataValue" swaggertype:"array,object"`
	RequestID string      `json:"requestID"`
	DataHash  string      `json:"dataHash"`
	DataType  string      `json:"dataType"`
	Message   string      `json:"message"`
	Success   bool        `json:"success"`
	DataTotal int         `json:"dataTotal"`
	Status    int         `json:"status"`
} // @Name Response

func (r *Response) Error() string {
	return r.Message
}

// WriteResponse writes a Response to a HTTP client.
func WriteResponse(ctx context.Context, w http.ResponseWriter, value any, ids []models.ID, total int, hash string, err error) errs.Err { //nolint:gocognit,revive
	r := Response{
		RequestID: getRequestID(ctx),
	}

	if err == nil {
		r.Status = http.StatusOK
		r.Success = true
	} else {
		var e errs.Err

		if errors.As(err, &e) {
			r.Message = e.Message()
			r.Status = e.Status()
		} else {
			err := logger.Log(ctx, errs.NewServerErr(err))
			r.Message = err.Error()
			r.Status = err.Status()
		}
	}

	w.WriteHeader(r.Status)

	if r.Status == errs.ErrStatusNoContent || (err == nil && value == nil && ids == nil) {
		return nil
	}

	w.Header().Set("Content-Type", "application/json")

	if r.Status < 400 {
		r.DataHash = hash
		r.DataTotal = total

		t := reflect.TypeOf(value)
		v := reflect.ValueOf(value)

		if t.Kind() == reflect.Pointer {
			t = t.Elem()
			v = v.Elem()
		}

		r.DataType = t.Name()

		if len(ids) == 0 {
			r.DataIDs = []models.ID{}
		} else {
			r.DataIDs = ids
		}

		if t.Kind() == reflect.Slice {
			if v.Len() > 0 {
				r.DataValue = value

				if r.DataTotal == 0 {
					r.DataTotal = v.Len()
				}
			} else {
				r.DataValue = []any{}
			}
		} else {
			var values []any

			values = append(values, value)
			r.DataValue = values
		}
	}

	j, err := json.Marshal(r)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	_, err = w.Write(j)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	return nil
}
