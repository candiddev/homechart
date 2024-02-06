import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import {
  ObjectCategoryCreated,
  ObjectCategoryDeleted,
  ObjectCategoryUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface ShopCategory {
  authHouseholdID: NullUUID;
  budgetPayeeID: NullUUID;
  created: NullTimestamp;
  id: NullUUID;
  match: string;
  name: string;
  updated: NullTimestamp;
}

class ShopCategoryManager extends DataArrayManager<ShopCategory> {
  constructor() {
    super("/api/v1/shop/categories", "name", false, DataTypeEnum.ShopCategory);
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
        msg = AuthAccountState.translate(ObjectCategoryCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectCategoryDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectCategoryUpdated);
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

  findMatch(name: string): ShopCategory {
    let matchLength = 0;
    let matchCategory = this.new();

    for (const category of this.data()) {
      if (category.match !== "") {
        const regex = new RegExp(`(${category.match})`, "i");
        const match = regex.exec(name);

        if (match !== null && match[0].length > matchLength) {
          matchLength = match[0].length;
          matchCategory = category;
        }
      }
    }

    return matchCategory;
  }

  override new(): ShopCategory {
    return {
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      budgetPayeeID: null,
      created: null,
      id: null,
      match: "",
      name: "",
      updated: null,
    };
  }
}

export const ShopCategoryState = new ShopCategoryManager();
