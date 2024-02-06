import { AppState } from "@lib/states/App";
import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";

import { InfoState } from "../states/Info";
import { SignIn } from "./SignIn";

test("SignIn", async () => {
  AppState.setSessionAuthenticated(false);
  InfoState.data().version = "Hello";
  localStorage.setItem("referral", "123");
  testing.mocks.route = "/signup?referral=123";
  testing.mocks.responses = [
    {
      dataType: "Info",
      dataValue: [],
    },
    {
      dataType: "OIDCProviders",
      dataValue: [OIDCProviderTypeEnum.Test],
    },
  ];

  testing.mount(SignIn, {});
  await testing.sleep(100);
  expect(document.title).toBe("Homechart - Sign In");
  testing.input("#form-item-input-email-address", "test@example.com");
  testing.input("#form-item-input-password", "12345678");
  testing.find("#form-checkbox-input-remember-me");
  testing.click("#form-checkbox-input-referral-code");
  testing.value("#form-item-input-referral-code", "123");
  testing.find("#button-sign-in");
  testing.notFind("#forgot-password");
  testing.find("#terms");
  testing.mocks.requests = [];
  testing.mocks.responses = [
    {
      dataType: "AuthSession",
      dataValue: [],
    },
  ];
  // testing.input("form-item-input-referral-code-optional", "123");
  testing.click("#button-sign-up-with-email-address");
  await testing.sleep(100);
  //expect((testing.mocks.requests[0].body as any).subscriptionReferrerCode)
  //.toBe("123");

  testing.mocks.route = "/signin";
  testing.mocks.responses = [
    {
      dataType: "Info",
      dataValue: [],
    },
    {
      dataType: "OIDCProviders",
      dataValue: [],
    },
  ];
  testing.mount(SignIn, {});
  await testing.sleep(100);
  testing.find("#forgot-password");
  testing.notFind("#form-item-input-self-hosted-address");
  testing.click("#self-hosted");
  testing.find("#form-item-input-self-hosted-address");
  testing.find("#button-sign-in-with-email-address");

  testing.mocks.responses = [
    {
      dataType: "Info",
      dataValue: [
        {
          cloud: false,
        },
      ],
    },
    {
      dataType: "OIDCProviders",
      dataValue: [],
    },
  ];
  testing.mount(SignIn, {});
  await testing.sleep(100);
  testing.notFind("#form-checkbox-input-self-hosted-address");
});
