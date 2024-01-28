import { Month, MonthEnum } from "@lib/types/Month";
import m from "mithril";

import { PermissionComponentsEnum } from "../types/Permission";
import { Alerts } from "../utilities/Alerts";
import { ObjectBookmarks, ObjectBudget, ObjectCalendar, ObjectCook, ObjectHealth, ObjectInventory, ObjectNotes, ObjectPlan, ObjectReward, ObjectSecrets, ObjectShop,WebFormOverlayCalendarEventReminder1Day, WebFormOverlayCalendarEventReminder1Hour, WebFormOverlayCalendarEventReminder10Minutes, WebFormOverlayCalendarEventReminder30Minutes, WebFormPermissionsBudgetTooltip, WebFormPermissionsCalendarTooltip,WebFormPermissionsCookTooltip,WebFormPermissionsHealthTooltip,WebFormPermissionsInventoryTooltip, WebFormPermissionsNotesTooltip,WebFormPermissionsPlanTooltip,WebFormPermissionsRewardTooltip,WebFormPermissionsSecretsTooltip,WebFormPermissionsSettingsTooltip,WebFormPermissionsShopTooltip, WebGlobalCustom, WebGlobalMonthApril, WebGlobalMonthAugust, WebGlobalMonthDecember,WebGlobalMonthFebruary, WebGlobalMonthJanuary, WebGlobalMonthJuly, WebGlobalMonthJune, WebGlobalMonthMarch, WebGlobalMonthMay, WebGlobalMonthNovember, WebGlobalMonthOctober, WebGlobalMonthSeptember, WebGlobalNever, WebGlobalSettings, WebGlobalSubscriptionProcessorFreeTrial,WebGlobalSubscriptionProcessorLifetime,WebGlobalSubscriptionProcessorMonthlyPaddle, WebGlobalTransactionStatusCleared, WebGlobalTransactionStatusReconciled, WebGlobalTransactionStatusUncleared } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";

let t = AuthAccountState.data().iso639Code;

export let Translations: {
	budgetTransactionAccountStatuses: string[],
	calendarEventReminderTimes: {
		name: string,
		offset: number | null,
	}[],
	components: {
		id: string,
		name: string,
	}[],
	monthValues: string[],
	permissions: {
		component: PermissionComponentsEnum,
		name: string,
		personal?: boolean,
		tooltip: string,
	}[],
	subscriptionProcessors: string[],
} = {
	budgetTransactionAccountStatuses: [],
	calendarEventReminderTimes: [],
	components: [],
	monthValues: [],
	permissions: [],
	subscriptionProcessors: [],
};


AuthAccountState.data.map((authAccount) => {
	if (t === authAccount.iso639Code && Translations.budgetTransactionAccountStatuses.length > 0) {
		return;
	}

	t = authAccount.iso639Code;
	Alerts.code = t;

	Translations = {
		budgetTransactionAccountStatuses: [
			AuthAccountState.translate(WebGlobalTransactionStatusCleared),
			AuthAccountState.translate(WebGlobalTransactionStatusReconciled),
			AuthAccountState.translate(WebGlobalTransactionStatusUncleared),
		],
		calendarEventReminderTimes: [
			{
				name: AuthAccountState.translate(WebGlobalNever),
				offset: null,
			},
			{
				name: AuthAccountState.translate(WebFormOverlayCalendarEventReminder10Minutes),
				offset: 10,
			},
			{
				name: AuthAccountState.translate(WebFormOverlayCalendarEventReminder30Minutes),
				offset: 30,
			},
			{
				name: AuthAccountState.translate(WebFormOverlayCalendarEventReminder1Hour),
				offset: 60,
			},
			{
				name: AuthAccountState.translate(WebFormOverlayCalendarEventReminder1Day),
				offset: 60*12,
			},
			{
				name: AuthAccountState.translate(WebGlobalCustom),
				offset: 0,
			},
		],
		components: [
			{
				id: "bookmarks",
				name: AuthAccountState.translate(ObjectBookmarks),
			},
			{
				id: "budget",
				name: AuthAccountState.translate(ObjectBudget),
			},
			{
				id: "calendar",
				name: AuthAccountState.translate(ObjectCalendar),
			},
			{
				id: "cook",
				name: AuthAccountState.translate(ObjectCook),
			},
			{
				id: "health",
				name: AuthAccountState.translate(ObjectHealth),
			},
			{
				id: "inventory",
				name: AuthAccountState.translate(ObjectInventory),
			},
			{
				id: "notes",
				name: AuthAccountState.translate(ObjectNotes),
			},
			{
				id: "plan",
				name: AuthAccountState.translate(ObjectPlan),
			},
			{
				id: "reward",
				name: AuthAccountState.translate(ObjectReward),
			},
			{
				id: "secrets",
				name: AuthAccountState.translate(ObjectSecrets),
			},
			{
				id: "shop",
				name: AuthAccountState.translate(ObjectShop),
			},
		],
		monthValues: Month.values.map((_month, i) => {
			let c = "";

			switch (i) {
			case MonthEnum.January:
				c = AuthAccountState.translate(WebGlobalMonthJanuary);
				break;
			case MonthEnum.February:
				c = AuthAccountState.translate(WebGlobalMonthFebruary);
				break;
			case MonthEnum.March:
				c = AuthAccountState.translate(WebGlobalMonthMarch);
				break;
			case MonthEnum.April:
				c = AuthAccountState.translate(WebGlobalMonthApril);
				break;
			case MonthEnum.May:
				c = AuthAccountState.translate(WebGlobalMonthMay);
				break;
			case MonthEnum.June:
				c = AuthAccountState.translate(WebGlobalMonthJune);
				break;
			case MonthEnum.July:
				c = AuthAccountState.translate(WebGlobalMonthJuly);
				break;
			case MonthEnum.August:
				c = AuthAccountState.translate(WebGlobalMonthAugust);
				break;
			case MonthEnum.September:
				c = AuthAccountState.translate(WebGlobalMonthSeptember);
				break;
			case MonthEnum.October:
				c = AuthAccountState.translate(WebGlobalMonthOctober);
				break;
			case MonthEnum.November:
				c = AuthAccountState.translate(WebGlobalMonthNovember);
				break;
			case MonthEnum.December:
				c = AuthAccountState.translate(WebGlobalMonthDecember);
				break;
			}

			return c;
		}),
		permissions: [
			{
				component: PermissionComponentsEnum.Budget,
				name: AuthAccountState.translate(ObjectBudget),
				tooltip: AuthAccountState.translate(WebFormPermissionsBudgetTooltip),
			},
			{
				component: PermissionComponentsEnum.Calendar,
				name: AuthAccountState.translate(ObjectCalendar),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsCalendarTooltip),
			},
			{
				component: PermissionComponentsEnum.Cook,
				name: AuthAccountState.translate(ObjectCook),
				tooltip: AuthAccountState.translate(WebFormPermissionsCookTooltip),
			},
			{
				component: PermissionComponentsEnum.Health,
				name: AuthAccountState.translate(ObjectHealth),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsHealthTooltip),
			},
			{
				component: PermissionComponentsEnum.Inventory,
				name: AuthAccountState.translate(ObjectInventory),
				tooltip: AuthAccountState.translate(WebFormPermissionsInventoryTooltip),
			},
			{
				component: PermissionComponentsEnum.Notes,
				name: AuthAccountState.translate(ObjectNotes),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsNotesTooltip),
			},
			{
				component: PermissionComponentsEnum.Plan,
				name: AuthAccountState.translate(ObjectPlan),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsPlanTooltip),
			},
			{
				component: PermissionComponentsEnum.Reward,
				name: AuthAccountState.translate(ObjectReward),
				tooltip: AuthAccountState.translate(WebFormPermissionsRewardTooltip),
			},
			{
				component: PermissionComponentsEnum.Auth,
				name: AuthAccountState.translate(WebGlobalSettings),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsSettingsTooltip),
			},
			{
				component: PermissionComponentsEnum.Secrets,
				name: AuthAccountState.translate(ObjectSecrets),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsSecretsTooltip),
			},
			{
				component: PermissionComponentsEnum.Shop,
				name: AuthAccountState.translate(ObjectShop),
				personal: true,
				tooltip: AuthAccountState.translate(WebFormPermissionsShopTooltip),
			},
		],
		subscriptionProcessors: [
			AuthAccountState.translate(WebGlobalSubscriptionProcessorFreeTrial),
			// TODO: remove these when enums are cleaned up
			"",
			"",
			"",
			AuthAccountState.translate(WebGlobalSubscriptionProcessorMonthlyPaddle),
			AuthAccountState.translate(WebGlobalSubscriptionProcessorLifetime),
		],
	};

	if (typeof window !== "undefined") {
		m.redraw();
	}
});
