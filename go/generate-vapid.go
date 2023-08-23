package main

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
)

func generateVAPID(ctx context.Context, _ []string, c *config.Config) errs.Err {
	prv, pub, err := notify.NewWebPushVAPID()
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(errors.New("error generating keys"), err))
	}

	m := map[string]string{
		"privateKey": prv,
		"publicKey":  pub,
	}

	j, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(errors.New("error generating keys"), err))
	}

	c.CLIConfig().Print(j)

	return nil
}
