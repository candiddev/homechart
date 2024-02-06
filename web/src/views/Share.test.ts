import seed from "../jest/seed";
import { AuthSessionState } from "../states/AuthSession";
import { Share } from "./Share";

test("Share", async () => {
  AuthSessionState.data(seed.authSessions[0]);
  testing.mocks.params = {
    text: "https://about.homechart.app",
    title: "Homechart+App",
  };
  testing.mount(Share, {});
  testing.value("#form-item-input-name", "Homechart App");
  testing.value("#form-item-input-url", testing.mocks.params.text);
  testing.find("#button-import-recipe-from-website");
  testing.find("#button-import-bookmark-from-website");
  testing.find("#button-add-task");
});
