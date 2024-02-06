import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import { TableNotifyOperationEnum } from "../types/TableNotify";
import {
  ObjectAccount,
  ObjectAccounts,
  ObjectBookmarks,
  ObjectBudget,
  ObjectCalendar,
  ObjectCard,
  ObjectCards,
  ObjectCategories,
  ObjectCategory,
  ObjectChangeCreated,
  ObjectChangeDeleted,
  ObjectChangeUpdated,
  ObjectCollection,
  ObjectCollections,
  ObjectCook,
  ObjectEvent,
  ObjectEvents,
  ObjectHealth,
  ObjectInventory,
  ObjectItem,
  ObjectItems,
  ObjectList,
  ObjectLists,
  ObjectLog,
  ObjectLogs,
  ObjectMealPlan,
  ObjectMealPlans,
  ObjectMealTime,
  ObjectMealTimes,
  ObjectNote,
  ObjectNotes,
  ObjectPayee,
  ObjectPayees,
  ObjectPlan,
  ObjectProject,
  ObjectProjects,
  ObjectRecipe,
  ObjectRecipes,
  ObjectRecurringTransaction,
  ObjectRecurringTransactions,
  ObjectReward,
  ObjectSecrets,
  ObjectShop,
  ObjectTask,
  ObjectTasks,
  ObjectVault,
  ObjectVaults,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface Change {
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  created: NullTimestamp;
  id: NullUUID;
  name: string;
  operation: TableNotifyOperationEnum;
  tableName: string;
  updated: NullTimestamp;
}

class ChangeManager extends DataArrayManager<Change> {
  table = this.data.map((changes) => {
    const data: {
      authAccountID: NullUUID;
      change: string;
      id: NullUUID;
      names: string[];
      updated: NullTimestamp;
    }[] = [];

    for (let i = 0; i < changes.length; i++) {
      const names: string[] = [changes[i].name];
      let j = i + 1;

      while (
        j < changes.length &&
        changes[i].authAccountID === changes[j].authAccountID &&
        changes[i].operation === changes[j].operation &&
        changes[i].tableName === changes[j].tableName
      ) {
        names.push(changes[j].name);
        j++;
      }

      let change = "";

      switch (changes[i].operation) {
        case TableNotifyOperationEnum.Create:
          change += "added";
          break;
        case TableNotifyOperationEnum.Delete:
          change += "deleted";
          break;
        case TableNotifyOperationEnum.Update:
          change += "updated";
          break;
      }

      change += names.length > 1 ? ` ${names.length} ` : " a ";

      change += "[";

      switch (changes[i].tableName) {
        case "bookmark":
          change +=
            names.length > 1
              ? AuthAccountState.translate(ObjectBookmarks)
              : "Bookmark";
          change += "](/bookmarks/household)";

          break;
        case "budget_account":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectAccounts)}`
              : `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectAccount)}`;
          change += "](/budget/accounts)";
          break;
        case "budget_category":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectCategories)}`
              : `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectCategory)}`;
          change += "](/budget/categories)";
          break;
        case "budget_payee":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectPayees)}`
              : `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectPayee)}`;
          change += "](/budget/payees)";
          break;
        case "budget_recurrence":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectRecurringTransactions)}`
              : `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectRecurringTransaction)}`;
          change += "](/budget/recurrences)";
          break;
        case "calendar_event":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectCalendar)} > ${AuthAccountState.translate(ObjectEvents)}`
              : `${AuthAccountState.translate(ObjectCalendar)} > ${AuthAccountState.translate(ObjectEvent)}`;
          change += "](/calendar)";
          break;
        case "cook_meal_plan":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectMealPlans)}`
              : `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectMealPlan)}`;
          change += "](/calendar)";
          break;
        case "cook_meal_time":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectMealTimes)}`
              : `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectMealTime)}`;
          change += "](/cook/meal-times)";
          break;
        case "cook_recipe":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectRecipes)}`
              : `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectRecipe)}`;
          change += "](/cook/recipes)";
          break;
        case "health_item":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectHealth)} > ${AuthAccountState.translate(ObjectItems)}`
              : `${AuthAccountState.translate(ObjectHealth)} > ${AuthAccountState.translate(ObjectItem)}`;
          change += "](/health/items)";
          break;
        case "health_log":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectHealth)} > ${AuthAccountState.translate(ObjectLogs)}`
              : `${AuthAccountState.translate(ObjectHealth)} > ${AuthAccountState.translate(ObjectLog)}`;
          change += "](/calendar)";
          break;
        case "inventory_collection":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectCollections)}`
              : `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectCollection)}`;
          change += "](/inventory)";
          break;
        case "inventory_item":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectItems)}`
              : `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectItem)}`;
          change += "](/inventory/all)";
          break;
        case "notes_page":
          change +=
            names.length > 1
              ? AuthAccountState.translate(ObjectNotes)
              : AuthAccountState.translate(ObjectNote);
          change += "](/notes/household)";
          break;
        case "plan_project":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectProjects)}`
              : `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectProject)}`;
          change += "](/plan/tasks?filter=household)";
          break;
        case "plan_task":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectTasks)}`
              : `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectTask)}`;
          change += "](/plan/tasks?filter=household)";
          break;
        case "reward_card":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectReward)} > ${AuthAccountState.translate(ObjectCards)}`
              : `${AuthAccountState.translate(ObjectReward)} > ${AuthAccountState.translate(ObjectCard)}`;
          change += "](/reward/sent)";
          break;
        case "secrets_vault":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectVaults)}`
              : `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectVault)}`;
          change += "](/secrets)";
          break;
        case "shop_category":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectCategories)}`
              : `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectCategory)}`;
          change += "](/shop/categories)";
          break;
        case "shop_item":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectItems)}`
              : `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectItem)}`;
          change += "](/shop/items)";
          break;
        case "shop_list":
          change +=
            names.length > 1
              ? `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectLists)}`
              : `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectList)}`;
          change += "](/shop/lists)";
          break;
      }

      data.push({
        authAccountID: changes[i].authAccountID,
        change: change,
        id: changes[i].id,
        names: names,
        updated: changes[i].updated,
      });

      if (data.length === 20) {
        break;
      }

      i = j - 1;
    }

    return data;
  });

  constructor() {
    super("/api/v1/changes", "updated", true, DataTypeEnum.Change);
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
        msg = AuthAccountState.translate(ObjectChangeCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectChangeDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectChangeUpdated);
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

  override new(): Change {
    return {
      authAccountID: null,
      authHouseholdID: null,
      created: null,
      id: null,
      name: "",
      operation: TableNotifyOperationEnum.Create,
      tableName: "",
      updated: null,
    };
  }
}

export const ChangeState = new ChangeManager();
