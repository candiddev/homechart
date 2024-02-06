import { API } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import type { TableNotify } from "../types/TableNotify";
import { TableNotifyOperationEnum } from "../types/TableNotify";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { BookmarkState } from "./Bookmark";
import { BudgetAccountState } from "./BudgetAccount";
import { BudgetCategoryState } from "./BudgetCategory";
import { BudgetPayeeState } from "./BudgetPayee";
import { BudgetRecurrenceState } from "./BudgetRecurrence";
import { CalendarEventState } from "./CalendarEvent";
import { CalendarICalendarState } from "./CalendarICalendar";
import { ChangeState } from "./Change";
import { CookMealPlanState } from "./CookMealPlan";
import { CookMealTimeState } from "./CookMealTime";
import { CookRecipeState } from "./CookRecipe";
import { HealthItemState } from "./HealthItem";
import { HealthLogState } from "./HealthLog";
import { InventoryCollectionState } from "./InventoryCollection";
import { InventoryItemState } from "./InventoryItem";
import { NotesPageState } from "./NotesPage";
import { NotesPageVersionState } from "./NotesPageVersion";
import { PlanProjectState } from "./PlanProject";
import { PlanTaskState } from "./PlanTask";
import { RewardCardState } from "./RewardCard";
import { SecretsValueState } from "./SecretsValue";
import { SecretsVaultState } from "./SecretsVault";
import { ShopCategoryState } from "./ShopCategory";
import { ShopItemState } from "./ShopItem";
import { ShopListState } from "./ShopList";

export const SSEState: {
  clearRefreshed(): void;
  init(): Promise<void>;
  reset(): void;
  sse: EventSource | null;
} = {
  clearRefreshed: () => {
    for (
      let i = 0 as DataTypeEnum;
      i < (Object.keys(DataTypeEnum).length as DataTypeEnum);
      i++
    ) {
      switch (i) {
        case DataTypeEnum.AuthAccount:
        case DataTypeEnum.AuthAccountAuthHousehold:
        case DataTypeEnum.AuthSession:
        case DataTypeEnum.BudgetMonth:
        case DataTypeEnum.BudgetMonthCategory:
        case DataTypeEnum.BudgetTransaction:
        case DataTypeEnum.Data:
          continue;
        case DataTypeEnum.AuthHousehold:
          AuthHouseholdState.refreshed = false;
          break;
        case DataTypeEnum.Bookmark:
          BookmarkState.refreshed = false;
          break;
        case DataTypeEnum.BudgetAccount:
          BudgetAccountState.refreshed = false;
          break;
        case DataTypeEnum.BudgetCategory:
          BudgetCategoryState.refreshed = false;
          break;
        case DataTypeEnum.BudgetPayee:
          BudgetPayeeState.refreshed = false;
          break;
        case DataTypeEnum.BudgetRecurrence:
          BudgetRecurrenceState.refreshed = false;
          break;
        case DataTypeEnum.CalendarEvent:
          CalendarEventState.refreshed = false;
          break;
        case DataTypeEnum.CalendarICalendar:
          CalendarICalendarState.refreshed = false;
          break;
        case DataTypeEnum.Change:
          ChangeState.refreshed = false;
          break;
        case DataTypeEnum.CookMealPlan:
          CookMealPlanState.refreshed = false;
          break;
        case DataTypeEnum.CookMealTime:
          CookMealTimeState.refreshed = false;
          break;
        case DataTypeEnum.CookRecipe:
          CookRecipeState.refreshed = false;
          break;
        case DataTypeEnum.HealthItem:
          HealthItemState.refreshed = false;
          break;
        case DataTypeEnum.HealthLog:
          HealthLogState.refreshed = false;
          break;
        case DataTypeEnum.InventoryCollection:
          InventoryCollectionState.refreshed = false;
          break;
        case DataTypeEnum.InventoryItem:
          InventoryItemState.refreshed = false;
          break;
        case DataTypeEnum.NotesPage:
          NotesPageState.refreshed = false;
          break;
        case DataTypeEnum.NotesPageVersion:
          NotesPageVersionState.refreshed = false;
          break;
        case DataTypeEnum.PlanProject:
          PlanProjectState.refreshed = false;
          break;
        case DataTypeEnum.PlanTask:
          PlanTaskState.refreshed = false;
          break;
        case DataTypeEnum.RewardCard:
          RewardCardState.refreshed = false;
          break;
        case DataTypeEnum.SecretsValue:
          SecretsValueState.refreshed = false;
          break;
        case DataTypeEnum.SecretsVault:
          SecretsVaultState.refreshed = false;
          break;
        case DataTypeEnum.ShopCategory:
          ShopCategoryState.refreshed = false;
          break;
        case DataTypeEnum.ShopItem:
          ShopItemState.refreshed = false;
          break;
        case DataTypeEnum.ShopList:
          ShopListState.refreshed = false;
          break;
      }
    }
  },
  init: async (): Promise<void> => {
    SSEState.sse = new EventSource(
      `${await API.getHostname()}/api/v1/sse/${AuthSessionState.data().id}`,
    );

    SSEState.sse.onerror = (): void => {
      SSEState.clearRefreshed();
      return;
    };

    SSEState.sse.onmessage = async (e): Promise<void> => {
      if (e.data === "") {
        return;
      }

      const n: TableNotify = JSON.parse(e.data as string);

      // Delay SSE routing to prevent an inflight update/create/delete not setting the data first and creating redundant calls.
      setTimeout(async () => {
        switch (n.table) {
          case "auth_account":
            return AuthAccountState.read(n);
          case "auth_account_auth_household":
            if (n.operation === TableNotifyOperationEnum.Delete) {
              n.operation = TableNotifyOperationEnum.Update;
            }

            return AuthHouseholdState.onSSE(n);
          case "auth_household":
            return AuthHouseholdState.onSSE(n);
          case "bookmark":
            await BookmarkState.onSSE(n);
            break;
          case "budget_account":
            await BudgetAccountState.onSSE(n);
            break;
          case "budget_category":
            await BudgetCategoryState.onSSE(n);
            break;
          case "budget_payee":
            await BudgetPayeeState.onSSE(n);
            break;
          case "budget_recurrence":
            await BudgetRecurrenceState.onSSE(n);
            break;
          case "calendar_event":
            await CalendarEventState.onSSE(n);
            break;
          case "calendar_icalendar":
            await CalendarICalendarState.onSSE(n);
            break;
          case "change":
            await ChangeState.onSSE(n);
            break;
          case "cook_meal_plan":
            await CookMealPlanState.onSSE(n);
            break;
          case "cook_meal_time":
            await CookMealTimeState.onSSE(n);
            break;
          case "cook_recipe":
            await CookRecipeState.onSSE(n);
            break;
          case "health_item":
            await HealthItemState.onSSE(n);
            break;
          case "health_log":
            await HealthLogState.onSSE(n);
            break;
          case "inventory_collection":
            await InventoryCollectionState.onSSE(n);
            break;
          case "inventory_item":
            await InventoryItemState.onSSE(n);
            break;
          case "notes_page":
            await NotesPageState.onSSE(n);
            break;
          case "notes_page_version":
            await NotesPageVersionState.onSSE(n);
            break;
          case "plan_project":
            await PlanProjectState.onSSE(n);
            break;
          case "plan_task":
            await PlanTaskState.onSSE(n);
            break;
          case "reward_card":
            await RewardCardState.onSSE(n);
            break;
          case "secrets_value":
            await SecretsValueState.onSSE(n);
            break;
          case "secrets_vault":
            await SecretsVaultState.onSSE(n);
            break;
          case "shop_category":
            await ShopCategoryState.onSSE(n);
            break;
          case "shop_item":
            await ShopItemState.onSSE(n);
            break;
          case "shop_list":
            await ShopListState.onSSE(n);
            break;
        }
      }, 500);
    };
  },
  reset: () => {
    if (SSEState.sse !== null) {
      SSEState.sse.close();
      SSEState.sse = null;
    }
  },
  sse: null,
};
