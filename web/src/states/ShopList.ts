import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import {
  ObjectListCreated,
  ObjectListDeleted,
  ObjectListUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface ShopList {
  [key: string]: boolean | null | number | string | undefined;
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  budgetCategoryID: NullUUID;
  created: NullTimestamp;
  icon: string;
  id: NullUUID;
  name: string;
  shopItemCount: number;
  shortID: string;
  updated: NullTimestamp;
}

class ShopListManager extends DataArrayManager<ShopList> {
  constructor() {
    super("/api/v1/shop/lists", "name", false, DataTypeEnum.ShopList);
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
        msg = AuthAccountState.translate(ObjectListCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectListDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectListUpdated);
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

  override new(): ShopList {
    const p = Permission.isPermitted(
      AuthSessionState.data().permissionsHouseholds,
      PermissionComponentsEnum.Shop,
      PermissionEnum.Edit,
      AuthAccountState.data().primaryAuthHouseholdID,
    );

    return {
      authAccountID: p ? null : AuthAccountState.data().id,
      authHouseholdID: p
        ? AuthAccountState.data().primaryAuthHouseholdID
        : null,
      budgetCategoryID: null,
      created: null,
      icon: "",
      id: null,
      name: "",
      shopItemCount: 0,
      shortID: "",
      updated: null,
    };
  }
}

export const ShopListState = new ShopListManager();
