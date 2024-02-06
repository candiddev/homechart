import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import m from "mithril";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import type { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { InfoState } from "./Info";

export interface PaddleConfig {
  planIDMonthly: number;
  productIDLifetime: number;
  sandbox: boolean;
  vendorID: number;
}

export interface PaddleURL {
  url: string;
}
export interface Prices {
  lifetime: string;
  monthly: string;
}

export const PaymentState: {
  cancel(authHouseholdID: NullUUID): Promise<void | Err>;
  createPaddle(
    authHouseholdID: NullUUID,
    processor: AuthHouseholdSubscriptionProcessorEnum,
  ): Promise<PaddleURL | Err>;
  inResponsePaddleConfig(
    response: APIResponse<unknown>,
  ): response is APIResponse<PaddleConfig[]>;
  inResponsePaddleURL(
    response: APIResponse<unknown>,
  ): response is APIResponse<PaddleURL[]>;
  paddle: PaddleConfig;
  prices: Stream<{
    monthly: string;
    lifetime: string;
  }>;
  productID: string; // eslint-disable-line
  readPaddle(): Promise<void | Err>;
  update(
    authHouseholdID: NullUUID,
    processor: AuthHouseholdSubscriptionProcessorEnum,
  ): Promise<void | Err>;
} = {
  cancel: async (authHouseholdID: NullUUID): Promise<void | Err> => {
    return API.delete("/api/v1/payments", {
      authHouseholdID: InfoState.data().cloud ? authHouseholdID : undefined,
      selfHostedID: InfoState.data().cloud ? undefined : authHouseholdID,
    }).then(async (err) => {
      if (IsErr(err)) {
        AppState.setLayoutAppAlert(err);

        return err;
      }
      if (!InfoState.data().cloud) {
        await AuthHouseholdState.read(authHouseholdID, undefined, true);
      }

      return;
    });
  },
  createPaddle: async (
    authHouseholdID: NullUUID,
    processor: AuthHouseholdSubscriptionProcessorEnum,
  ): Promise<PaddleURL | Err> => {
    return API.create("/api/v1/payments", {
      authHouseholdID: InfoState.data().cloud ? authHouseholdID : undefined,
      baseURL: `${window.location.protocol}//${window.location.host}`,
      emailAddress: AuthAccountState.data().emailAddress,
      processor: processor,
      selfHostedID: InfoState.data().cloud ? undefined : authHouseholdID,
    }).then(async (response) => {
      if (IsErr(response)) {
        AppState.setLayoutAppAlert(response);

        return response;
      }

      if (PaymentState.inResponsePaddleURL(response)) {
        return response.dataValue[0];
      }

      return ErrUnknownResponse;
    });
  },
  inResponsePaddleConfig: (
    response: APIResponse<unknown>,
  ): response is APIResponse<PaddleConfig[]> => {
    return response.dataType === "paddleConfig";
  },
  inResponsePaddleURL: (
    response: APIResponse<unknown>,
  ): response is APIResponse<PaddleURL[]> => {
    return response.dataType === "paddleURL";
  },
  paddle: {
    planIDMonthly: 0,
    productIDLifetime: 0,
    sandbox: false,
    vendorID: 0,
  },
  prices: Stream({
    lifetime: "",
    monthly: "",
  }),
  productID: "",
  readPaddle: async (): Promise<void | Err> => {
    if (PaymentState.prices().monthly !== "") {
      return;
    }

    return new Promise((resolve) => {
      const e = document.createElement("script");
      e.src = "https://cdn.paddle.com/paddle/paddle.js";
      e.onload = async (): Promise<void> => {
        return API.read("/api/v1/payments/paddle", {}).then(
          async (response) => {
            if (IsErr(response)) {
              AppState.setLayoutAppAlert(response);

              return;
            }

            if (PaymentState.inResponsePaddleConfig(response)) {
              PaymentState.paddle = response.dataValue[0];

              if (PaymentState.paddle.sandbox) {
                Paddle.Environment.set("sandbox");
              }

              Paddle.Setup({
                vendor: PaymentState.paddle.vendorID,
              });

              Paddle.Product.Prices(
                PaymentState.paddle.planIDMonthly,
                (price) => {
                  PaymentState.prices({
                    ...PaymentState.prices(),
                    ...{
                      monthly: price.price.net.replace(price.country, ""),
                    },
                  });
                  m.redraw();
                },
              );

              Paddle.Product.Prices(
                PaymentState.paddle.productIDLifetime,
                (price) => {
                  PaymentState.prices({
                    ...PaymentState.prices(),
                    ...{
                      ...{
                        lifetime: price.price.net.replace(price.country, ""),
                      },
                    },
                  });
                  m.redraw();
                },
              );

              return resolve();
            }

            AppState.setLayoutAppAlert(ErrUnknownResponse);

            return resolve();
          },
        );
      };

      document.head.appendChild(e);
    });
  },
  update: async (
    authHouseholdID: NullUUID,
    processor: AuthHouseholdSubscriptionProcessorEnum,
  ): Promise<void | Err> => {
    return API.update("/api/v1/payments", {
      authHouseholdID: InfoState.data().cloud ? authHouseholdID : undefined,
      processor: processor,
      selfHostedID: InfoState.data().cloud ? undefined : authHouseholdID,
    }).then((err) => {
      if (IsErr(err)) {
        return err;
      }

      return;
    });
  },
};
