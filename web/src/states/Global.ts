import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { DisplayEnum } from "@lib/types/Display";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";

import { MarkdownLinks } from "../components/MarkdownLinks";
import { API } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import { AuthHouseholdSubscriptionProcessorEnum } from "../types/AuthHouseholdSubscriptionProcessor";
import { DataType, DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import { Alerts } from "../utilities/Alerts";
import { Analytics } from "../utilities/Analytics";
import { Controller } from "../worker";
import type { WorkerResponseFilterSortChildren } from "../worker/FilterSortChildren";
import type { WorkerResponse } from "../worker/Handler";
import { WorkerAction } from "../worker/Handler";
import type { WorkerResponseReadAll } from "../worker/ReadAll";
import {
  ISO639Codes,
  ObjectChange,
  Translate,
  WebGlobalWrongLocale,
  WebGlobalWrongTimeZone1,
  WebGlobalWrongTimeZone2,
  WebGlobalWrongVersion,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionManager, AuthSessionState } from "./AuthSession";
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
import { InfoState } from "./Info";
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
import { SSEState } from "./SSE";

export const GlobalState = {
  alertSubscription: (): void => {
    if (!AuthAccountState.isDemo() && !AuthAccountState.data().child) {
      for (const household of AuthHouseholdState.data()) {
        if (
          household.subscriptionProcessor ===
          AuthHouseholdSubscriptionProcessorEnum.None
        ) {
          if (
            m.route.get().startsWith("/setup") ||
            (AppState.getSessionRedirects().length === 1 &&
              AppState.getSessionRedirects()[0].startsWith("/setup"))
          ) {
            return;
          }

          const expires = CivilDate.fromString(
            household.subscriptionExpires as string,
          );
          const today = Timestamp.now();
          const soon = Timestamp.now();
          soon.addDays(5);

          if (
            !InfoState.data().cloud &&
            household.id === null &&
            AuthAccountState.data().setup
          ) {
            Alerts.subscriptionNeeded();
          } else if (expires < today.toCivilDate()) {
            Alerts.subscriptionExpired(AppState.formatCivilDate(expires));
          } else if (expires < soon.toCivilDate()) {
            Alerts.subscriptionExpiring(AppState.formatCivilDate(expires));
          }
        }
      }
    }
  },
  handleResponse: (res: WorkerResponse): void => {
    let func = "readAll";

    switch (res.action) {
      case WorkerAction.FilterSortChildren:
        func = "filter";
        const filter = res as WorkerResponseFilterSortChildren;

        switch (filter.type) {
          case DataTypeEnum.NotesPage:
            NotesPageState.setNested(filter.data);
            break;
          case DataTypeEnum.PlanProject:
            PlanProjectState.setNested(filter.data);
            m.redraw();
            break;
          case DataTypeEnum.PlanTask:
            PlanTaskState.setNested(filter.data);
            m.redraw();
            break;
          default:
            break;
        }
        return;
      case WorkerAction.Reset:
      case WorkerAction.Set:
        return;
      case WorkerAction.Read:
        func = "read";
      case WorkerAction.ReadAll: // eslint-disable-line no-fallthrough
        const read = res as WorkerResponseReadAll;

        if (IsErr(read.data)) {
          AppState.setLayoutAppAlert(read.data);

          return;
        }

        if (read.data.offline) {
          Alerts.offline();
        } else {
          Alerts.online();
        }

        switch (read.type) {
          case DataTypeEnum.AuthAccount:
          case DataTypeEnum.AuthAccountAuthHousehold:
          case DataTypeEnum.AuthSession:
          case DataTypeEnum.BudgetMonth:
          case DataTypeEnum.BudgetMonthCategory:
          case DataTypeEnum.BudgetTransaction:
          case DataTypeEnum.Data: {
            return;
          }
          case DataTypeEnum.AuthHousehold:
            AuthHouseholdState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.Bookmark:
            BookmarkState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.BudgetAccount:
            BudgetAccountState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.BudgetCategory:
            BudgetCategoryState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.BudgetPayee:
            BudgetPayeeState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.BudgetRecurrence:
            BudgetRecurrenceState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.CalendarEvent:
            CalendarEventState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.CalendarICalendar:
            CalendarICalendarState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.Change:
            ChangeState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.CookMealPlan:
            CookMealPlanState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.CookMealTime:
            CookMealTimeState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.CookRecipe:
            CookRecipeState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.HealthItem:
            HealthItemState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.HealthLog:
            HealthLogState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.InventoryCollection:
            InventoryCollectionState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.InventoryItem:
            InventoryItemState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.NotesPage:
            NotesPageState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.NotesPageVersion:
            NotesPageVersionState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.PlanProject:
            PlanProjectState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.PlanTask:
            PlanTaskState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.RewardCard:
            RewardCardState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.SecretsValue:
            SecretsValueState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.SecretsVault:
            SecretsVaultState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.ShopCategory:
            ShopCategoryState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.ShopItem:
            ShopItemState.set(read.data.data, read.data.hash);
            break;
          case DataTypeEnum.ShopList:
            ShopListState.set(read.data.data, read.data.hash);
            break;
        }

        Telemetry.spanEnd(`${DataType.getArray(read.type)}.${func}`);
    }
  },
  hideComponentIncludes(component: string): boolean {
    const name = component.toLowerCase();

    return (
      AuthHouseholdState.isHidden(name) ||
      AuthAccountState.data().preferences.hideComponents.includes(name)
    );
  },
  init: (): void => {
    IndexedDB.init();
    Controller.init(GlobalState.handleResponse);
  },
  permitted: (
    component: PermissionComponentsEnum,
    edit?: boolean,
    authHouseholdID?: NullUUID,
  ): boolean => {
    let permission: PermissionEnum = PermissionEnum.View;

    if (
      !AppState.isSessionAuthenticated() ||
      (edit === true &&
        authHouseholdID !== undefined &&
        authHouseholdID !== null &&
        component !== PermissionComponentsEnum.Auth &&
        !AuthAccountState.isDemo() &&
        AuthHouseholdState.isExpired(authHouseholdID))
    ) {
      return false;
    }

    if (edit === true) {
      permission = PermissionEnum.Edit;
    }

    switch (component) {
      case PermissionComponentsEnum.Budget:
      case PermissionComponentsEnum.Cook:
      case PermissionComponentsEnum.Inventory:
      case PermissionComponentsEnum.Reward:
        return Permission.isPermitted(
          AuthSessionState.data().permissionsHouseholds,
          component,
          permission,
        );
      case PermissionComponentsEnum.Auth:
      case PermissionComponentsEnum.Calendar:
      case PermissionComponentsEnum.Health:
      case PermissionComponentsEnum.Notes:
      case PermissionComponentsEnum.Plan:
      case PermissionComponentsEnum.Secrets:
      case PermissionComponentsEnum.Shop:
        switch (authHouseholdID === undefined || authHouseholdID === null) {
          case true:
            return (
              (AuthSessionState.data().permissionsAccount[
                Permission.components[component]
              ] as PermissionEnum) <= permission
            );
          case false:
            return Permission.isPermitted(
              AuthSessionState.data().permissionsHouseholds,
              component,
              permission,
              authHouseholdID,
            );
        }
    }
  },
  readAll: (): void => {
    if (process.env.NODE_ENV !== "test") {
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
          case DataTypeEnum.Data: {
            continue;
          }
          case DataTypeEnum.AuthHousehold:
            AuthHouseholdState.readAll();
            break;
          case DataTypeEnum.Bookmark:
            BookmarkState.readAll();
            break;
          case DataTypeEnum.BudgetAccount:
            BudgetAccountState.readAll();
            break;
          case DataTypeEnum.BudgetCategory:
            BudgetCategoryState.readAll();
            break;
          case DataTypeEnum.BudgetPayee:
            BudgetPayeeState.readAll();
            break;
          case DataTypeEnum.BudgetRecurrence:
            BudgetRecurrenceState.readAll();
            break;
          case DataTypeEnum.CalendarEvent:
            CalendarEventState.readAll();
            break;
          case DataTypeEnum.CalendarICalendar:
            CalendarICalendarState.readAll();
            break;
          case DataTypeEnum.Change:
            ChangeState.readAll();
            break;
          case DataTypeEnum.CookMealPlan:
            CookMealPlanState.readAll();
            break;
          case DataTypeEnum.CookMealTime:
            CookMealTimeState.readAll();
            break;
          case DataTypeEnum.CookRecipe:
            CookRecipeState.readAll();
            break;
          case DataTypeEnum.HealthItem:
            HealthItemState.readAll();
            break;
          case DataTypeEnum.HealthLog:
            HealthLogState.readAll();
            break;
          case DataTypeEnum.InventoryCollection:
            InventoryCollectionState.readAll();
            break;
          case DataTypeEnum.InventoryItem:
            InventoryItemState.readAll();
            break;
          case DataTypeEnum.NotesPage:
            NotesPageState.readAll();
            break;
          case DataTypeEnum.NotesPageVersion:
            NotesPageVersionState.readAll();
            break;
          case DataTypeEnum.PlanProject:
            PlanProjectState.readAll();
            break;
          case DataTypeEnum.PlanTask:
            PlanTaskState.readAll();
            break;
          case DataTypeEnum.RewardCard:
            RewardCardState.readAll();
            break;
          case DataTypeEnum.SecretsValue:
            SecretsValueState.readAll();
            break;
          case DataTypeEnum.SecretsVault:
            SecretsVaultState.readAll();
            break;
          case DataTypeEnum.ShopCategory:
            ShopCategoryState.readAll();
            break;
          case DataTypeEnum.ShopItem:
            ShopItemState.readAll();
            break;
          case DataTypeEnum.ShopList:
            ShopListState.readAll();
            break;
        }
      }
    }
  },
  signIn: async (): Promise<void> => {
    Telemetry.spanStart("Global.SignIn");

    await InfoState.read();

    if (!InfoState.data().cloud) {
      const av = InfoState.data().version.split(".");
      const uv = `${process.env.BUILD_VERSION}`.split(".");

      if (av.length === 3 && uv.length === 3 && av[1] !== uv[1]) {
        AppState.setLayoutAppAlert({
          message: AuthAccountState.translate(WebGlobalWrongVersion),
          persist: true,
        });

        return;
      }
    }

    return AuthSessionState.validate()
      .then(async (err) => {
        if (IsErr(err)) {
          throw err; // eslint-disable-line no-restricted-syntax
        }

        // During signin, all we have is AuthSessionState
        AuthAccountState.data().id = AuthSessionState.data().authAccountID;

        if (AuthSessionState.data().admin === true) {
          AppState.setSessionAdmin(true);
        }

        return AuthAccountState.read();
      })
      .then(async (err) => {
        if (IsErr(err)) {
          throw err; // eslint-disable-line no-restricted-syntax
        }

        if (process.env.NODE_ENV !== "test") {
          await SSEState.init();
          await AuthAccountState.decryptPrivateKeys("");
        }

        if (AuthAccountState.data().setup) {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (AuthAccountState.data().timeZone !== timeZone) {
            const msg = `${AuthAccountState.translate(WebGlobalWrongTimeZone1)} (${AuthAccountState.data().timeZone.replace(/_/g, " ")}) ${AuthAccountState.translate(WebGlobalWrongTimeZone2)} (${timeZone.replace(/_/g, " ")})`;

            AppState.setLayoutAppAlert({
              actions: [
                {
                  name: AuthAccountState.translate(ObjectChange),
                  onclick: async (): Promise<void> => {
                    AppState.clearLayoutAppAlert(msg);
                    await AuthAccountState.update({
                      ...AuthAccountState.data(),
                      ...{
                        timeZone: timeZone,
                      },
                    });
                  },
                },
              ],
              message: msg,
              persist: true,
            });
          }

          const iso639 = navigator.language.split("-")[0];
          if (
            ISO639Codes[iso639] !== undefined &&
            AuthAccountState.data().iso639Code !== iso639
          ) {
            const msg = `${AuthAccountState.translate(WebGlobalWrongLocale)} ${ISO639Codes[iso639]}?`;

            AppState.setLayoutAppAlert({
              actions: [
                {
                  name: Translate(iso639, ObjectChange),
                  onclick: async (): Promise<void> => {
                    AppState.clearLayoutAppAlert(msg);
                    await AuthAccountState.update({
                      ...AuthAccountState.data(),
                      ...{
                        iso639Code: iso639,
                      },
                    });
                  },
                },
              ],
              message: msg,
              persist: true,
            });
          }
        }

        if (AuthAccountState.data().setup) {
          if (!AuthAccountState.data().verified) {
            AuthAccountState.alertVerifyEmail();
          }
          GlobalState.alertSubscription();
        } else {
          AppState.setSessionRedirect("/setup");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).dataLayer === undefined) {
          (window as any).dataLayer = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).dataLayer.push({
          authAccountID: AuthAccountState.data().id,
          cloud: InfoState.data().cloud,
          demo: AuthAccountState.isDemo(),
        });

        if (AuthAccountState.data().setup) {
          Analytics.login(AuthAccountState.data().oidcProviderType);
        } else {
          Analytics.signUp(AuthAccountState.data().oidcProviderType);
        }

        AppState.setSessionAuthenticated(true);
        GlobalState.readAll();
        AppState.redirect();

        if (AuthSessionState.data().webPush === null) {
          AuthSessionState.toggleNotifications(); // eslint-disable-line @typescript-eslint/no-floating-promises
        }

        if (
          AppState.getSessionDisplay() === DisplayEnum.XLarge &&
          m.route.get() !== undefined &&
          !m.route.get().includes("/setup")
        ) {
          AppState.toggleLayoutAppMenuOpen(true);
        }

        Telemetry.spanEnd("Global.SignIn");
      })
      .catch(async (err) => {
        Telemetry.spanEnd("Global.SignIn");

        NewErr(
          `Global.Signin: error during signin: ${JSON.stringify(err)}`,
          "There was a problem signing you in.",
        );

        if (
          m.route.get().includes("/reset") ||
          m.route.get().includes("/signin") ||
          m.route.get().includes("/signup") ||
          m.route.get().includes("/about") ||
          m.route.get().includes("/cook/recipes/")
        ) {
          return;
        }

        if (
          !AppState.isSessionOnline() &&
          AuthSessionState.data().id !== null
        ) {
          AppState.setSessionAuthenticated(true);
          AppState.redirect();
          return;
        }

        return GlobalState.signOut();
      });
  },
  signOut: async (noRedirect?: boolean): Promise<void> => {
    return IndexedDB.clear().then(() => {
      API.clearAPIEndpoint();

      for (
        let i = 0 as DataTypeEnum;
        i < (Object.keys(DataTypeEnum).length as DataTypeEnum);
        i++
      ) {
        switch (i) {
          case DataTypeEnum.AuthAccountAuthHousehold:
          case DataTypeEnum.BudgetMonth:
          case DataTypeEnum.BudgetMonthCategory:
          case DataTypeEnum.BudgetTransaction:
          case DataTypeEnum.Data: {
            continue;
          }
          case DataTypeEnum.AuthAccount:
            AuthAccountState.reset();
            break;
          case DataTypeEnum.AuthSession:
            AuthSessionState.reset();
            break;
          case DataTypeEnum.AuthHousehold:
            AuthHouseholdState.reset();
            break;
          case DataTypeEnum.Bookmark:
            BookmarkState.reset();
            break;
          case DataTypeEnum.BudgetAccount:
            BudgetAccountState.reset();
            break;
          case DataTypeEnum.BudgetCategory:
            BudgetCategoryState.reset();
            break;
          case DataTypeEnum.BudgetPayee:
            BudgetPayeeState.reset();
            break;
          case DataTypeEnum.BudgetRecurrence:
            BudgetRecurrenceState.reset();
            break;
          case DataTypeEnum.CalendarEvent:
            CalendarEventState.reset();
            break;
          case DataTypeEnum.CalendarICalendar:
            CalendarICalendarState.reset();
            break;
          case DataTypeEnum.Change:
            ChangeState.reset();
            break;
          case DataTypeEnum.CookMealPlan:
            CookMealPlanState.reset();
            break;
          case DataTypeEnum.CookMealTime:
            CookMealTimeState.reset();
            break;
          case DataTypeEnum.CookRecipe:
            CookRecipeState.reset();
            break;
          case DataTypeEnum.HealthItem:
            HealthItemState.reset();
            break;
          case DataTypeEnum.HealthLog:
            HealthLogState.reset();
            break;
          case DataTypeEnum.InventoryCollection:
            InventoryCollectionState.reset();
            break;
          case DataTypeEnum.InventoryItem:
            InventoryItemState.reset();
            break;
          case DataTypeEnum.NotesPage:
            NotesPageState.reset();
            break;
          case DataTypeEnum.NotesPageVersion:
            NotesPageVersionState.reset();
            break;
          case DataTypeEnum.PlanProject:
            PlanProjectState.reset();
            break;
          case DataTypeEnum.PlanTask:
            PlanTaskState.reset();
            break;
          case DataTypeEnum.RewardCard:
            RewardCardState.reset();
            break;
          case DataTypeEnum.SecretsValue:
            SecretsValueState.reset();
            break;
          case DataTypeEnum.SecretsVault:
            SecretsVaultState.reset();
            break;
          case DataTypeEnum.ShopCategory:
            ShopCategoryState.reset();
            break;
          case DataTypeEnum.ShopItem:
            ShopItemState.reset();
            break;
          case DataTypeEnum.ShopList:
            ShopListState.reset();
            break;
        }
      }

      AppState.setSessionAdmin(false);
      if (noRedirect !== true) {
        AppState.reset();
        AuthSessionState.reset();

        if (
          m.route.get() !== "/signin" &&
          m.route.get() !== "/signout" &&
          m.route.get() !== undefined
        ) {
          AppState.setSessionRedirect(m.route.get());
        }

        if (process.env.NODE_ENV !== "test" && m.route.get() !== "/signin") {
          window.location.href = "/signin";
        }
      }
    });
  },
  switch: async (): Promise<void | Err> => {
    const hostname = await API.getHostname();
    const oldSession = new AuthSessionManager();

    oldSession.data(Clone(AuthSessionState.data()));

    await AuthSessionState.create(true);
    await oldSession.delete(null, true);

    const s = AuthSessionState.data();

    return GlobalState.signOut(true)
      .then(async () => {
        AuthSessionState.data(s);

        return API.setAuth({
          id: s.id,
          key: s.key,
        });
      })
      .then(async () => {
        return API.setHostname(hostname);
      })
      .then(async () => {
        GlobalState.init();
        AppState.setSessionRedirect("/home");
        return GlobalState.signIn();
      });
  },
};

if (process.env.NODE_ENV === "test") {
  AppState.parserMarkdown = MarkdownLinks;
  AppState.setSessionAuthenticated(true);
  GlobalState.init();
}
