import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Clone } from "@lib/utilities/Clone";
import { Sort } from "@lib/utilities/Sort";

import { DataTypeEnum } from "../types/DataType";
import {
  ObjectMealTimeCreated,
  ObjectMealTimeDeleted,
  ObjectMealTimeUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface CookMealTime {
  authHouseholdID: NullUUID;
  created: NullUUID;
  id: NullUUID;
  name: string;
  time: NullCivilTime;
  updated: NullTimestamp;
}

class CookMealTimeManager extends DataArrayManager<CookMealTime> {
  override names = this.data.map((meals) => {
    const m = Clone(meals);
    const names: string[] = [];
    Sort(m, {
      property: "time",
    });
    for (const object of m) {
      names.push(object.name);
    }
    return names;
  });

  constructor() {
    super("/api/v1/cook/meal-times", "name", false, DataTypeEnum.CookMealTime);
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
        msg = AuthAccountState.translate(ObjectMealTimeCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectMealTimeDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectMealTimeUpdated);
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

  override new(): CookMealTime {
    return {
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      created: null,
      id: null,
      name: "",
      time: null,
      updated: null,
    };
  }
}

export const CookMealTimeState = new CookMealTimeManager();
