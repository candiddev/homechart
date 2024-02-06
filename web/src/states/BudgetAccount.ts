import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { API } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import {
  ObjectAccountCreated,
  ObjectAccountDeleted,
  ObjectAccountUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface BudgetAccount {
  [index: string]: boolean | null | number | string;
  authHouseholdID: NullUUID;
  budget: boolean;
  budgetTransactionAmount: number;
  budgetTransactionAmountCleared: number;
  budgetTransactionAmountReconciled: number;
  created: NullTimestamp;
  hidden: boolean;
  icon: string;
  id: NullUUID;
  name: string;
  shortID: string;
  updated: NullTimestamp;
}

class BudgetAccountManager extends DataArrayManager<BudgetAccount> {
  constructor() {
    super("/api/v1/budget/accounts", "name", false, DataTypeEnum.BudgetAccount);
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
        msg = AuthAccountState.translate(ObjectAccountCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectAccountDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectAccountUpdated);
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

  override new(): BudgetAccount {
    return {
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      budget: true,
      budgetTransactionAmount: 0,
      budgetTransactionAmountCleared: 0,
      budgetTransactionAmountReconciled: 0,
      created: null,
      hidden: false,
      icon: "",
      id: null,
      name: "",
      shortID: "",
      updated: null,
    };
  }

  async reconcile(id: NullUUID): Promise<void> {
    await API.create(`/api/v1/budget/accounts/${id}/reconcile`).then(() => {});
  }
}

export const BudgetAccountState = new BudgetAccountManager();
