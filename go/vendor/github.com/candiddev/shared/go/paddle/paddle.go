// Package paddle is used for interacting with Paddle payments and subscriptions.
package paddle

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// Config contains Paddle options.
type Config struct {
	Mock                  func(ctx context.Context, dest any, method, path string, data url.Values) errs.Err `json:"-"`
	PlanIDMonthly         int                                                                                `json:"planIDMonthly,omitempty"`
	PlanIDMonthlyReferral int                                                                                `json:"planIDMonthlyReferral,omitempty"`
	PlanIDYearly          int                                                                                `json:"planIDYearly,omitempty"`
	ProductIDLifetime     int                                                                                `json:"productIDLifetime,omitempty"`
	PublicKeyBase64       string                                                                             `json:"publicKeyBase64,omitempty"`
	Sandbox               bool                                                                               `json:"sandbox,omitempty"`
	VendorAuthCode        string                                                                             `json:"vendorAuthCode,omitempty"`
	VendorID              int                                                                                `json:"vendorID,omitempty"`
}

var ErrPaddleAction = errors.New("unable to perform request to Paddle")

type paddleResponse struct {
	Success  bool                `json:"success"`
	Error    paddleResponseError `json:"error"`
	Response any                 `json:"response"`
}

type paddleResponseError struct {
	Message string `json:"message"`
}

// Request makes a HTTP request to Paddle's API endpoint.
func (c *Config) Request(ctx context.Context, dest any, method, path string, data url.Values) errs.Err {
	ctx = logger.Trace(ctx)

	if c.Mock != nil {
		return c.Mock(ctx, dest, method, path, data)
	}

	data.Set("vendor_auth_code", c.VendorAuthCode)
	data.Set("vendor_id", strconv.Itoa(c.VendorID))

	endpoint := "https://vendors.paddle.com"

	if c.Sandbox {
		endpoint = "https://sandbox-vendors.paddle.com"
	}

	r, err := http.NewRequestWithContext(ctx, method, endpoint+path, strings.NewReader(data.Encode()))
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, err))
	}

	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	r.Header.Add("Content-Length", strconv.Itoa(len(data.Encode())))

	client := &http.Client{}

	res, err := client.Do(r)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, err))
	}

	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, err))
	}

	var j json.RawMessage

	pres := paddleResponse{
		Response: &j,
	}

	if err := json.Unmarshal(body, &pres); err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, err))
	}

	if !pres.Success {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, errors.New(pres.Error.Message)))
	}

	if dest != nil {
		if err := json.Unmarshal(j, dest); err != nil {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPaddleAction, err))
		}
	}

	return logger.Error(ctx, nil)
}
