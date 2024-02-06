import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";

import { OIDCAction, OIDCState } from "../states/OIDC";
import { OIDCButtons } from "./OIDCButtons";

test("OIDCButtons", async () => {
  const state = {
    disabled: false,
  };

  testing.mocks.responses = [
    {
      dataType: "OIDCProviders",
      dataValue: [OIDCProviderTypeEnum.Google],
    },
  ];

  testing.mount(OIDCButtons, state);
  await testing.sleep(100);

  testing.find("#button-google");

  testing.mocks.responses = [
    {
      dataType: "OIDCRedirect",
      dataValue: [
        {
          redirect: "/",
          state: "1",
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
  testing.click("#button-google");
  await testing.sleep(100);
  expect(await OIDCState.load()).toStrictEqual({
    action: OIDCAction.SignIn,
    redirects: [],
    state: "1",
    type: OIDCProviderTypeEnum.Google,
  });

  state.disabled = true;
  testing.redraw();
  testing.hasAttribute("#button-google", "disabled", "");
});
