import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import type { UserAgent } from "@lib/types/UserAgent";
import { getUserAgent } from "@lib/types/UserAgent";

import { API, apiEndpoint, ErrUnknownResponse } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import type { Permissions, PermissionsHousehold } from "../types/Permission";
import { Permission } from "../types/Permission";
import {
  ObjectSessionCreated,
  ObjectSessionDeleted,
  ObjectSessionUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataManager } from "./Data";
import { InfoState } from "./Info";

export interface AuthSession {
  admin?: boolean;
  authAccountID: NullUUID;
  created: NullTimestamp;
  expires: NullTimestamp;
  id: NullUUID;
  key: NullUUID;
  name: string;
  permissionsAccount: Permissions;
  permissionsHouseholds: PermissionsHousehold[] | null;
  primaryAuthHouseholdID: NullUUID;
  userAgent: UserAgent;
  webPush: {
    auth: string;
    endpoint: string;
    p256: string;
  } | null;
}

export class AuthSessionManager extends DataManager<AuthSession> {
  constructor(data?: AuthSession) {
    super("/api/v1/auth/sessions", DataTypeEnum.AuthSession, data);
  }

  override alertAction(a: ActionsEnum, hideAlert?: boolean): void {
    let msg = "";

    switch (a) {
      case ActionsEnum.Create:
        msg = AuthAccountState.translate(ObjectSessionCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectSessionDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectSessionUpdated);
        break;
    }

    AppState.setLayoutAppAlert(
      {
        message: msg,
      },
      hideAlert,
    );
  }

  async deleteAll(): Promise<void> {
    return API.delete("/api/v1/auth/sessions").then(() => {});
  }

  // Don't log AuthSession failures
  override inResponse(
    response: APIResponse<unknown>,
  ): response is APIResponse<AuthSession[]> {
    if (
      response.dataType === this.typeObject &&
      Array.isArray(response.dataValue) &&
      response.dataValue.length === 1
    ) {
      return true;
    }
    return false;
  }

  isArray(
    response: APIResponse<unknown>,
  ): response is APIResponse<AuthSession[]> {
    return response.dataType === "AuthSessions";
  }

  override new(): AuthSession {
    return {
      authAccountID: null,
      created: null,
      expires: null,
      id: null,
      key: null,
      name: "",
      permissionsAccount: Permission.new(),
      permissionsHouseholds: [],
      primaryAuthHouseholdID: null,
      userAgent: getUserAgent(),
      webPush: null,
    };
  }

  async readAll(): Promise<AuthSession[] | Err> {
    return API.read("/api/v1/auth/sessions", {}).then(async (response) => {
      if (IsErr(response)) {
        return response;
      }

      if (this.isArray(response)) {
        return response.dataValue;
      }

      return [];
    });
  }

  async toggleNotifications(): Promise<void | Err> {
    const session = this.data();

    if (
      "Notification" in window &&
      process.env.NODE_ENV !== "test" &&
      !AuthAccountState.isDemo()
    ) {
      if (session.webPush === null && InfoState.data().vapid !== "") {
        return Notification.requestPermission(async (permission: string) => {
          if (permission !== "granted") {
            return NewErr(`Notifications not permitted: ${permission}`);
          }

          await this.unsubscribeWebPush();

          return AppState.getSessionServiceWorkerRegistration()
            ?.pushManager.subscribe({
              applicationServerKey: InfoState.data().vapid,
              userVisibleOnly: true,
            })
            .then(async (value) => {
              const v = JSON.parse(JSON.stringify(value));

              if (v.keys !== undefined) {
                session.webPush = {
                  auth: v.keys.auth,
                  endpoint: value.endpoint,
                  p256: v.keys.p256dh,
                };

                return this.update(session, true);
              }
            })
            .catch((err) => {
              return NewErr(err);
            });
        })
          .then(() => {})
          .catch((err) => {
            return NewErr(
              `AuthSession.toggleNotifications: error requesting permissions: ${err}`,
            );
          });
      } else if (session.webPush !== null) {
        session.webPush = null;

        await this.unsubscribeWebPush();

        return this.update(session);
      }
    }
  }

  async unsubscribeWebPush(): Promise<void> {
    return AppState.getSessionServiceWorkerRegistration()
      ?.pushManager.getSubscription()
      .then(async (subscription) => {
        if (subscription !== null) {
          return subscription.unsubscribe();
        }

        return;
      })
      .then(() => {});
  }

  async validate(): Promise<void | Err> {
    if (AuthSessionState.data().id === null && apiEndpoint().id === "") {
      return ErrUnknownResponse;
    }

    return API.read("/api/v1/auth/signin", {}).then(async (response) => {
      if (IsErr(response)) {
        return response;
      }

      if (response.status === 0 || response.status === 204) {
        return;
      }

      if (this.inResponse(response)) {
        return this.set(response.dataValue[0]);
      }

      return ErrUnknownResponse;
    });
  }
}

export const AuthSessionState = new AuthSessionManager();
