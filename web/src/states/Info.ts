import { IsErr } from "@lib/services/Log";
import { getUserAgent } from "@lib/types/UserAgent";
import m from "mithril";
import Stream from "mithril/stream";

import { API } from "../services/API";

export interface Info {
  cloud: boolean;
  demo?: boolean;
  featureVotes?: string[];
  motd?: string;
  vapid: string;
  version: string;
}

class InfoManager {
  data = Stream(this.new());
  lock = false;

  is(data: unknown): data is Info[] {
    return (
      data !== undefined &&
      data !== null &&
      Array.isArray(data) &&
      data.length === 1
    );
  }

  new(): Info {
    return {
      cloud: process.env.NODE_ENV === "test",
      vapid: "",
      version: "",
    };
  }

  async read(force?: boolean): Promise<void> {
    if ((force !== true && this.data().version !== "") || this.lock) {
      return;
    }

    this.lock = true;

    await API.read(`/api?p=${getUserAgent()}`, {}).then(async (response) => {
      this.lock = false;

      if (!IsErr(response) && this.is(response.dataValue)) {
        this.data(response.dataValue[0]);
      } else {
        this.data(InfoState.new());
      }

      m.redraw();

      return;
    });
  }

  reset(): void {
    this.data(this.new());
  }
}

export const InfoState = new InfoManager();
