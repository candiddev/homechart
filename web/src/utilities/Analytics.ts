import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";

import { Translations } from "../states/Translations";
import type { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";

function dataLayerPush(_obj: Object): void {}

export const Analytics = {
  beginCheckout: (): void => {
    dataLayerPush({
      event: "begin_checkout",
    });
  },
  login: (type: OIDCProviderTypeEnum): void => {
    dataLayerPush({
      event: "login",
      method: type === OIDCProviderTypeEnum.Google ? "google" : "email",
    });
  },
  purchase: (processor: AuthHouseholdSubscriptionProcessorEnum): void => {
    dataLayerPush({
      event: "purchase",
      processor: Translations.subscriptionProcessors[processor],
    });
  },
  signUp: (type: OIDCProviderTypeEnum): void => {
    dataLayerPush({
      event: "sign_up",
      method: type === OIDCProviderTypeEnum.Google ? "google" : "email",
    });
  },
};
