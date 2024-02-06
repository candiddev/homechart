import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import type Stream from "mithril/stream";

import { Colors } from "../types/Colors";
import { DataTypeEnum } from "../types/DataType";
import {
  ObjectLogCreated,
  ObjectLogDeleted,
  ObjectLogUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import type { CalendarEvent, CalendarEventRange } from "./CalendarEvent";
import { CalendarEventState } from "./CalendarEvent";
import { DataArrayManager } from "./DataArray";
import { HealthItemState } from "./HealthItem";

export interface HealthLog {
  authAccountID: NullUUID;
  created: NullTimestamp;
  date: NullCivilDate;
  healthItemID: NullUUID;
  nameInput?: string; // Not sent by API
  nameOutput?: string; // Not sent by API
  id: NullUUID;
  updated: NullTimestamp;
}

class HealthLogManager extends DataArrayManager<HealthLog> {
  constructor() {
    super("/api/v1/health/logs", "timestamp", false, DataTypeEnum.HealthLog);
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
        msg = AuthAccountState.translate(ObjectLogCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectLogDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectLogUpdated);
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

  findDateRange(from: CivilDate, to: CivilDate): Stream<CalendarEventRange> {
    return this.data.map((logs) => {
      const events: CalendarEvent[] = [];

      const fromValue = from.valueOf();
      const toValue = to.valueOf();

      for (const log of logs) {
        const date = CivilDate.fromString(log.date as string);
        const ts = Timestamp.fromCivilDate(date);

        if (
          date.valueOf() <= toValue &&
          date.valueOf() >= fromValue &&
          !AuthAccountState.data().preferences.hideCalendarHealthLogs.includes(
            log.authAccountID as string,
          )
        ) {
          const index = events.findIndex((event) => {
            return (
              event.authAccountID === log.authAccountID &&
              event.timestampStart === ts.toString()
            );
          });

          const item = HealthItemState.findID(log.healthItemID);

          if (index < 0) {
            events.push({
              ...CalendarEventState.new(),
              ...{
                authAccountID: log.authAccountID,
                color: Colors.healthLog(
                  AuthHouseholdState.findMember(log.authAccountID).color,
                ),
                duration: 0,
                healthLogInputs: item.output ? [] : [log],
                healthLogOutputs: item.output ? [log] : [],
                icon: Icons.Health,
                name: "Health Logs",
                participants: [`${log.authAccountID}`],
                timestampEnd: ts.toString(),
                timestampStart: ts.toString(),
              },
            });
          } else if (item.output) {
            events[index].healthLogOutputs!.push(log); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          } else {
            events[index].healthLogInputs!.push(log); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          }
        }
      }

      return CalendarEventState.toCalendarEventsRange(events, from, to);
    });
  }

  findAuthAccountID(
    authAccountID: NullUUID,
    date?: NullCivilDate,
  ): Stream<HealthLog[]> {
    return this.data.map((items) => {
      return items.filter((item) => {
        return (
          item.authAccountID === authAccountID &&
          (date === undefined || item.date === date)
        );
      });
    });
  }

  override new(): HealthLog {
    return {
      authAccountID: AuthAccountState.data().id,
      created: null,
      date: null,
      healthItemID: null,
      id: null,
      updated: null,
    };
  }
}

export const HealthLogState = new HealthLogManager();
