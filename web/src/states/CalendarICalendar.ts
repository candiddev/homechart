import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import {
  ObjectiCalendarCreated,
  ObjectiCalendarDeleted,
  ObjectiCalendarUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface CalendarICalendar {
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  created: NullUUID;
  ics: string;
  id: NullUUID;
  name: string;
  url: string;
  updated: NullTimestamp;
}

class CalendarICalendarManager extends DataArrayManager<CalendarICalendar> {
  constructor() {
    super(
      "/api/v1/calendar/icalendars",
      "name",
      false,
      DataTypeEnum.CalendarICalendar,
    );
  }

  override alertAction(
    a: ActionsEnum,
    hideAlert?: boolean,
    actions?: {
      name: string;
      onclick(): Promise<void>;
    }[],
  ): void {
    let msg = "";

    switch (a) {
      case ActionsEnum.Create:
        msg = AuthAccountState.translate(ObjectiCalendarCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectiCalendarDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectiCalendarUpdated);
        break;
    }

    AppState.setLayoutAppAlert(
      {
        actions: actions,
        message: msg,
      },
      hideAlert,
    );
  }

  override new(): CalendarICalendar {
    const p = Permission.isPermitted(
      AuthSessionState.data().permissionsHouseholds,
      PermissionComponentsEnum.Calendar,
      PermissionEnum.Edit,
      AuthAccountState.data().primaryAuthHouseholdID,
    );

    return {
      authAccountID: p ? null : AuthAccountState.data().id,
      authHouseholdID: p
        ? AuthAccountState.data().primaryAuthHouseholdID
        : null,
      created: null,
      ics: "",
      id: null,
      name: "",
      updated: null,
      url: "",
    };
  }
}

export const CalendarICalendarState = new CalendarICalendarManager();
