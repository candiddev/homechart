import { AppState } from "@lib/states/App";
import m from "mithril";

const UUID =
  /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

export const TelemetryState = {
  createError: async (error: string): Promise<void> => {
    if (AppState.isSessionOnline()) {
      return m
        .request({
          body: {
            error: error,
            path:
              m.route.get() === undefined
                ? ""
                : m.route.get().replace(UUID, "id"),
            version: process.env.BUILD_VERSION,
          },
          method: "POST",
          url: "/api/v1/telemetry/errors",
        })
        .then(() => {})
        .catch(() => {});
    }
  },
};
