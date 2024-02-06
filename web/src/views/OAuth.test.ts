import { AuthAccountState } from "../states/AuthAccount";
import type { AuthSession } from "../states/AuthSession";
import { AuthSessionState } from "../states/AuthSession";
import { InfoState } from "../states/Info";
import { OAuth } from "./OAuth";

describe("OAuth", () => {
  test("amazon", async () => {
    testing.mocks.params = {
      client_id: "amazon_alexa", // eslint-disable-line camelcase
      redirect_uri: "https://pitangui.amazon.com/spa/skill", // eslint-disable-line camelcase
      state: "1",
    };

    testing.mount(OAuth, {});

    testing.text(
      "#oauth-title",
      "Amazon Alexawants to access your Homechart account",
    );
  });

  test("google", async () => {
    AuthAccountState.data().primaryAuthHouseholdID = "1";
    testing.mocks.params = {
      client_id: "google_assistant", // eslint-disable-line camelcase
      redirect_uri: "https://oauth-redirect.googleusercontent.com/r/test", // eslint-disable-line camelcase
      state: "1",
    };

    testing.mount(OAuth, {});

    testing.text(
      "#oauth-title",
      "Google Assistantwants to access your Homechart account",
    );
    testing.mocks.responses = [
      {
        dataType: "AuthSession",
        dataValue: [
          {
            ...AuthSessionState.new(),
            ...{
              authHouseholdID: "1",
              id: "2",
              key: "3",
            },
          },
        ],
      },
    ];

    window = Object.create(window); // eslint-disable-line
    const url = "http://homechart.app";
    Object.defineProperty(window, "location", {
      value: {
        href: url,
      },
      writable: true,
    });
    InfoState.data().cloud = false;
    testing.click("#button-allow");
    await testing.sleep(100);
    expect((testing.mocks.requests[0].body as AuthSession).name).toBe(
      "Google Assistant",
    );

    expect(window.location.href).toBe(
      "https://oauth-redirect.googleusercontent.com/r/test#access_token=1_2_3&token_type=bearer&state=1",
    );
  });
});
