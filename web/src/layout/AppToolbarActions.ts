import type { AppToolbarActionAttrs } from "@lib/layout/AppToolbarAction";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import m from "mithril";

import { FormOverlayBookmark } from "../components/FormOverlayBookmark";
import { FormOverlayBudgetAccount } from "../components/FormOverlayBudgetAccount";
import { FormOverlayBudgetCategory } from "../components/FormOverlayBudgetCategory";
import { FormOverlayBudgetPayee } from "../components/FormOverlayBudgetPayee";
import { FormOverlayBudgetTransaction } from "../components/FormOverlayBudgetTransaction";
import { FormOverlayCalendarEvent } from "../components/FormOverlayCalendarEvent";
import { FormOverlayCookMealPlan } from "../components/FormOverlayCookMealPlan";
import { FormOverlayCookMealTime } from "../components/FormOverlayCookMealTime";
import { FormOverlayHealthItem } from "../components/FormOverlayHealthItem";
import { FormOverlayHealthLogs } from "../components/FormOverlayHealthLogs";
import { FormOverlayInventoryCollection } from "../components/FormOverlayInventoryCollection";
import { FormOverlayInventoryItem } from "../components/FormOverlayInventoryItem";
import { FormOverlayPlanProject } from "../components/FormOverlayPlanProject";
import { FormOverlayPlanTask } from "../components/FormOverlayPlanTask";
import { FormOverlayRewardCard } from "../components/FormOverlayRewardCard";
import { FormOverlaySecretsValue } from "../components/FormOverlaySecretsValue";
import { FormOverlaySecretsVault } from "../components/FormOverlaySecretsVault";
import { FormOverlayShopCategory } from "../components/FormOverlayShopCategory";
import { FormOverlayShopItem } from "../components/FormOverlayShopItem";
import { FormOverlayShopList } from "../components/FormOverlayShopList";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BookmarkState } from "../states/Bookmark";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetMonthCategoryState } from "../states/BudgetMonthCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import { CalendarEventState } from "../states/CalendarEvent";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { HealthItemState } from "../states/HealthItem";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { NotesPageState } from "../states/NotesPage";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { RewardCardState } from "../states/RewardCard";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectAccount, ObjectBookmark, ObjectBookmarks, ObjectBudget, ObjectCalendar, ObjectCard, ObjectCategory, ObjectCollection, ObjectCook, ObjectEvent, ObjectHealth, ObjectInput, ObjectInventory, ObjectItem, ObjectList, ObjectLogs, ObjectMealPlan, ObjectMealTime, ObjectNotes, ObjectOutput, ObjectPage, ObjectPayee, ObjectPlan, ObjectProject, ObjectRecipe, ObjectReward, ObjectSecrets, ObjectShop, ObjectStore, ObjectTask, ObjectTransaction, ObjectValue, ObjectVault } from "../yaml8n";

export function AppToolbarActions (): AppToolbarActionAttrs {
	return {
		headerBookmarks: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectBookmarks),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && ! GlobalState.hideComponentIncludes("Bookmarks"),
			requireOnline: true,
		},
		newBookmark: {
			icon: Icons.Bookmark,
			name: AuthAccountState.translate(ObjectBookmark),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBookmark, BookmarkState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && ! GlobalState.hideComponentIncludes("Bookmarks"),
			requireOnline: true,
		},
		headerBudget: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectBudget),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && ! GlobalState.hideComponentIncludes("Budget"),
			requireOnline: true,
		},
		newBudgetAccount: {
			icon: Icons.BudgetAccount,
			id: BudgetAccountState.typeObject,
			name: AuthAccountState.translate(ObjectAccount),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBudgetAccount, BudgetAccountState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && ! GlobalState.hideComponentIncludes("Budget"),
			requireOnline: true,
		},
		newBudgetCategory: {
			icon: Icons.BudgetCategory,
			id: BudgetCategoryState.typeObject,
			name: AuthAccountState.translate(ObjectCategory),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBudgetCategory, BudgetMonthCategoryState.new() as Data);
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && ! GlobalState.hideComponentIncludes("Budget"),
			requireOnline: true,
		},
		newBudgetPayee: {
			icon: Icons.BudgetPayee,
			id: BudgetPayeeState.typeObject,
			name: AuthAccountState.translate(ObjectPayee),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBudgetPayee, BudgetPayeeState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && ! GlobalState.hideComponentIncludes("Budget"),
			requireOnline: true,
		},
		newBudgetTransaction: {
			icon: Icons.BudgetTransaction,
			id: "BudgetTransaction",
			name: AuthAccountState.translate(ObjectTransaction),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBudgetTransaction, BudgetRecurrenceState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Budget, true) && ! GlobalState.hideComponentIncludes("Budget"),
			requireOnline: true,
		},
		headerCalendar: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectCalendar),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Calendar, true) && ! GlobalState.hideComponentIncludes("Calendar"),
			requireOnline: true,
		},
		newCalendarEvent: {
			icon: Icons.Calendar,
			id: CalendarEventState.typeObject,
			name: AuthAccountState.translate(ObjectEvent),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayCalendarEvent, CalendarEventState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Calendar, true) && ! GlobalState.hideComponentIncludes("Calendar"),
			requireOnline: true,
		},
		headerCook: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectCook),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true) && ! GlobalState.hideComponentIncludes("Cook"),
			requireOnline: true,
		},
		newCookMealPlan: {
			icon: Icons.CookMealPlan,
			id: CookMealPlanState.typeObject,
			name: AuthAccountState.translate(ObjectMealPlan),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayCookMealPlan, CookMealPlanState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true) && ! GlobalState.hideComponentIncludes("Cook"),
			requireOnline: true,
		},
		newCookMealTime: {
			icon: Icons.CookMealTime,
			id: CookMealTimeState.typeObject,
			name: AuthAccountState.translate(ObjectMealTime),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayCookMealTime, CookMealTimeState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true) && ! GlobalState.hideComponentIncludes("Cook"),
			requireOnline: true,
		},
		newCookRecipe: {
			icon: Icons.CookRecipe,
			id: CookRecipeState.typeObject,
			name: AuthAccountState.translate(ObjectRecipe),
			onclick: (): void => {
				m.route.set("/cook/recipes/new?edit");
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true) && ! GlobalState.hideComponentIncludes("Cook"),
			requireOnline: true,
		},
		headerHealth: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectHealth),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true) && ! GlobalState.hideComponentIncludes("Health"),
			requireOnline: true,
		},
		newHealthItemInput: {
			icon: Icons.HealthItemInput,
			id: "HealthItemInput",
			name: AuthAccountState.translate(ObjectInput),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayHealthItem, HealthItemState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true) && ! GlobalState.hideComponentIncludes("Health"),
			requireOnline: true,
		},
		newHealthItemOutput: {
			icon: Icons.HealthItemOutput,
			id: "HealthItemOutput",
			name: AuthAccountState.translate(ObjectOutput),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayHealthItem, {
					...HealthItemState.new(),
					...{
						output: true,
					},
				});
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true) && ! GlobalState.hideComponentIncludes("Health"),
			requireOnline: true,
		},
		newHealthLogs: {
			icon: Icons.HealthLog,
			id: "HealthItemLog",
			name: AuthAccountState.translate(ObjectLogs),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayHealthLogs, {
					authAccountID: AuthAccountState.data().id,
					date: CivilDate.now()
						.toJSON(),
					id: null,
					logs: [],
				} as unknown as Data);
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true) && ! GlobalState.hideComponentIncludes("Health"),
			requireOnline: true,
		},
		headerInventory: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectInventory),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Inventory, true) && ! GlobalState.hideComponentIncludes("Inventory"),
			requireOnline: true,
		},
		newInventoryCollection: {
			icon: Icons.InventoryCollection,
			id: InventoryCollectionState.typeObject,
			name: AuthAccountState.translate(ObjectCollection),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayInventoryCollection, InventoryCollectionState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Inventory, true) && ! GlobalState.hideComponentIncludes("Inventory"),
			requireOnline: true,
		},
		newInventoryItem: {
			icon: Icons.Inventory,
			id: InventoryItemState.typeObject,
			name: AuthAccountState.translate(ObjectItem),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayInventoryItem, InventoryItemState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Inventory, true) && ! GlobalState.hideComponentIncludes("Inventory"),
			requireOnline: true,
		},
		headerNotes: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectNotes),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Notes, true) && ! GlobalState.hideComponentIncludes("Notes"),
			requireOnline: true,
		},
		newNotesPage: {
			icon: Icons.Notes,
			id: NotesPageState.typeObject,
			name: AuthAccountState.translate(ObjectPage),
			onclick: (): void => {
				m.route.set("/notes/household/new?edit");
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Notes, true) && ! GlobalState.hideComponentIncludes("Notes"),
			requireOnline: true,
		},
		headerPlan: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectPlan),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true) && ! GlobalState.hideComponentIncludes("Plan"),
			requireOnline: true,
		},
		newPlanProject: {
			icon: Icons.PlanProject,
			id: PlanProjectState.typeObject,
			name: AuthAccountState.translate(ObjectProject),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayPlanProject, PlanProjectState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true) && ! GlobalState.hideComponentIncludes("Plan"),
			requireOnline: true,
		},
		newPlanTask: {
			icon: Icons.PlanTask,
			id: PlanTaskState.typeObject,
			name: AuthAccountState.translate(ObjectTask),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayPlanTask, PlanTaskState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true) && ! GlobalState.hideComponentIncludes("Plan"),
			requireOnline: true,
		},
		headerReward: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectReward),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Reward, true) && ! GlobalState.hideComponentIncludes("Reward"),
			requireOnline: true,
		},
		newRewardCard: {
			icon: Icons.Reward,
			id: PlanProjectState.typeObject,
			name: AuthAccountState.translate(ObjectCard),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayRewardCard, RewardCardState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Reward, true) && ! GlobalState.hideComponentIncludes("Reward"),
			requireOnline: true,
		},
		headerSecrets: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectSecrets),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Secrets, true) && ! GlobalState.hideComponentIncludes("Secrets"),
			requireOnline: true,
		},
		newSecretsVault: {
			icon: Icons.SecretsVault,
			id: SecretsVaultState.typeObject,
			name: AuthAccountState.translate(ObjectVault),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlaySecretsVault, SecretsVaultState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Secrets"),
			requireOnline: true,
		},
		newSecretsValue: { // eslint-disable-line sort-keys
			icon: Icons.SecretsValue,
			id: SecretsValueState.typeObject,
			name: AuthAccountState.translate(ObjectValue),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlaySecretsValue, SecretsValueState.newDecrypted());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Secrets"),
			requireOnline: true,
		},
		headerShop: { // eslint-disable-line sort-keys
			header: true,
			name: AuthAccountState.translate(ObjectShop),
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop"),
			requireOnline: true,
		},
		newShopCategory: {
			icon: Icons.ShopCategory,
			id: ShopCategoryState.typeObject,
			name: AuthAccountState.translate(ObjectCategory),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayShopCategory, ShopCategoryState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop") && AuthHouseholdState.data().length > 0,
			requireOnline: true,
		},
		newShopItem: {
			icon: Icons.ShopItem,
			id: ShopItemState.typeObject,
			name: AuthAccountState.translate(ObjectItem),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayShopItem, ShopItemState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop"),
			requireOnline: true,
		},
		newShopList: {
			icon: Icons.ShopList,
			id: ShopListState.typeObject,
			name: AuthAccountState.translate(ObjectList),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayShopList, ShopListState.new());
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop"),
			requireOnline: true,
		},
		newShopStore: {
			icon: Icons.BudgetPayee,
			id: "ShopStore",
			name: AuthAccountState.translate(ObjectStore),
			onclick: (): void => {
				AppState.setLayoutAppForm(FormOverlayBudgetPayee, {
					...BudgetPayeeState.new(),
					...{
						shopStore: true,
					},
				});
			},
			permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop"),
			requireOnline: true,
		},
	};
}
