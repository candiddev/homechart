package main

import (
	"context"
	"errors"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
)

func generateVAPID(ctx context.Context, _ []string, _ *config.Config) errs.Err {
	prv, pub, err := notify.NewWebPushVAPID()
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error generating keys"), err))
	}

	m := map[string]string{
		"privateKey": prv,
		"publicKey":  pub,
	}

	logger.Raw(types.JSONToString(m))

	return nil
}
