import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Timestamp } from "@lib/types/Timestamp";
import m from "mithril";
import Stream from "mithril/stream";

import { API } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import type { DataTypeEnum } from "../types/DataType";
import { DataType } from "../types/DataType";
import type { TableNotify } from "../types/TableNotify";
import { Alerts } from "../utilities/Alerts";

export class DataManager<T extends Data> {
  data = Stream(this.new());

  path: string;
  readLock = false;
  type: DataTypeEnum;
  typeObject: string;

  constructor(path: string, type: DataTypeEnum, data?: T) {
    this.path = path;
    this.type = type;
    this.typeObject = DataType.getObject(type);

    if (data !== undefined) {
      this.data(data);
    }
  }

  alertAction(a: ActionsEnum, hideAlert?: boolean): void {
    let msg = "";
    switch (a) {
      case ActionsEnum.Create:
        msg = "Data created";
        break;
      case ActionsEnum.Delete:
        msg = "Data deleted";
        break;
      case ActionsEnum.Update:
        msg = "Data updated";
        break;
    }

    AppState.setLayoutAppAlert(
      {
        message: msg,
      },
      hideAlert,
    );
  }

  async create(hideAlert?: boolean): Promise<void | Err> {
    Telemetry.spanStart(`${this.typeObject}.create`);

    return API.create(this.path, this.data()).then(async (response) => {
      Telemetry.spanEnd(`${this.typeObject}.create`);

      if (IsErr(response)) {
        AppState.setLayoutAppAlert(response, hideAlert);

        return response;
      }

      if (this.inResponse(response)) {
        this.alertAction(ActionsEnum.Create, hideAlert);

        return this.set(response.dataValue[0]);
      }

      return;
    });
  }

  async delete(id?: NullUUID, hideAlert?: boolean): Promise<void | Err> {
    Telemetry.spanStart(`${this.typeObject}.create`);

    if (id === undefined || id === null) {
      id = this.data().id; // eslint-disable-line no-param-reassign
    }

    return API.delete(`${this.path}/${id}`).then((err) => {
      Telemetry.spanEnd(`${this.typeObject}.create`);

      if (IsErr(err)) {
        AppState.setLayoutAppAlert(err, hideAlert);

        return err;
      }

      this.alertAction(ActionsEnum.Delete, hideAlert);

      return;
    });
  }

  is(data: unknown): data is T {
    return data !== null;
  }

  inResponse(response: APIResponse<unknown>): response is APIResponse<T[]> {
    if (
      response.dataType === this.typeObject &&
      Array.isArray(response.dataValue) &&
      response.dataValue.length === 1
    ) {
      return true;
    }

    NewErr(
      `${this.typeObject}.inResponse:\n${response.dataType} ${response.dataValue}`,
    );

    return false;
  }

  async load(): Promise<void | Err> {
    return IndexedDB.get(this.typeObject).then(async (data) => {
      if (this.is(data)) {
        return this.set(
          {
            ...this.new(),
            ...data,
          },
          false,
        );
      }
    });
  }

  new(): T {
    return {
      id: null,
      name: "",
      parentID: null,
      shortID: "",
      tags: [] as string[],
      updated: null,
    } as T;
  }

  async read(n?: TableNotify): Promise<void | Err> {
    if (
      !this.readLock &&
      (n === undefined || this.data().updated !== n.updated)
    ) {
      Telemetry.spanStart(`${this.typeObject}.read`);

      this.readLock = true;

      return API.read(`${this.path}/${this.data().id}`, {
        updated: this.data().updated,
      }).then(async (response) => {
        Telemetry.spanEnd(`${this.typeObject}.read`);

        this.readLock = false;

        if (IsErr(response)) {
          return response;
        }

        if (response.status === 0) {
          Alerts.offline();
          return;
        }

        Alerts.online();

        if (response.status === 204) {
          return;
        }

        if (response.status === 403 || response.status === 410) {
          m.route.set("/signout");

          return;
        }

        if (this.inResponse(response)) {
          return this.set(response.dataValue[0]);
        }
      });
    }
  }

  reset(): void {
    this.data(this.new());
  }

  async set(data?: T, save?: boolean): Promise<void | Err> {
    if (data !== undefined) {
      this.data(data);
    }

    m.redraw();

    if (save !== false) {
      return IndexedDB.set(this.typeObject, this.data());
    }
  }

  async update(data: T, hideAlert?: boolean): Promise<void | Err> {
    Telemetry.spanStart(`${this.typeObject}.update`);
    this.readLock = true;

    let path = `${this.path}/${this.data().id}`;

    if (data.id !== this.data().id) {
      path = `${this.path}/${data.id}`;
    }

    return API.update(path, data).then(async (response) => {
      Telemetry.spanEnd(`${this.typeObject}.update`);
      this.readLock = false;

      if (IsErr(response)) {
        AppState.setLayoutAppAlert(response, hideAlert);

        return response;
      }

      if (response.status === 0 || response.status === 204) {
        this.alertAction(ActionsEnum.Update, hideAlert);

        return;
      }

      if (this.inResponse(response)) {
        this.alertAction(ActionsEnum.Update, hideAlert);

        return this.set(response.dataValue[0]);
      }
    });
  }

  get updated(): Timestamp | null {
    const updated = this.data().updated;
    if (typeof updated === "string") {
      return Timestamp.fromString(updated);
    }

    return null;
  }
}
