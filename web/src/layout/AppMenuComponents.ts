import type { AppMenuComponent } from "@lib/layout/AppMenu";
import type { AppMenuComponentView } from "@lib/layout/AppMenuComponent";
import type { AppMenuComponentViewItem } from "@lib/layout/AppMenuComponentView";
import type { AppMenuNestedData } from "@lib/layout/AppMenuNested";
import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Currency } from "@lib/types/Currency";
import { DisplayEnum } from "@lib/types/Display";
import { Icons } from "@lib/types/Icons";
import { Sort } from "@lib/utilities/Sort";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BookmarkState } from "../states/Bookmark";
import type { BudgetAccount } from "../states/BudgetAccount";
import { BudgetAccountState } from "../states/BudgetAccount";
import type { BudgetPayee } from "../states/BudgetPayee";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GlobalState } from "../states/Global";
import { InfoState } from "../states/Info";
import { InventoryCollectionState } from "../states/InventoryCollection";
import type { NotesPage } from "../states/NotesPage";
import { NotesPageState } from "../states/NotesPage";
import type { PlanProject } from "../states/PlanProject";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { RewardCardState } from "../states/RewardCard";
import { SecretsVaultState } from "../states/SecretsVault";
import { ShopItemState } from "../states/ShopItem";
import type { ShopList } from "../states/ShopList";
import { ShopListState } from "../states/ShopList";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectAccount, ObjectAccounts, ObjectBookmarks, ObjectBudget, ObjectCalendar, ObjectCategories, ObjectCook, ObjectHealth, ObjectHousehold, ObjectHouseholds, ObjectInputs, ObjectInventory, ObjectListPickUp, ObjectLists, ObjectLogs, ObjectMealPlans, ObjectMealTimes, ObjectNotes, ObjectNotifications, ObjectOutputs, ObjectPayees, ObjectPlan, ObjectRecipes, ObjectReward, ObjectSecrets, ObjectSessions, ObjectShop, ObjectStaples, ObjectStores, WebFormOverlayRewardCardRedeemable, WebGlobalAbout, WebGlobalAboutAPIReference, WebGlobalAboutOSL, WebGlobalAboutPrivacyPolicy, WebGlobalAboutRoadmap, WebGlobalAboutTermsService, WebGlobalAboutWhatsNew, WebGlobalActionEndDemo, WebGlobalActionSignIn, WebGlobalActionSignInChild, WebGlobalActionSignOut, WebGlobalAdmin, WebGlobalAll, WebGlobalAllCollections, WebGlobalAllItems, WebGlobalAllValues, WebGlobalAllVaults, WebGlobalBudgetCharts, WebGlobalBudgetChartsIncomeExpense, WebGlobalBudgetChartsSpendingByCategory, WebGlobalBudgetChartsSpendingByPayee, WebGlobalFeatureVoting, WebGlobalInProgress, WebGlobalInstallHomechart, WebGlobalInstallHomechartiOS, WebGlobalPersonal, WebGlobalSent, WebGlobalSettings, WebGlobalSubscription, WebGlobalTemplates, WebGlobalToday, WebGlobalUpcoming } from "../yaml8n";

export const AppMenuComponents: Stream<AppMenuComponent[]> = Stream([] as AppMenuComponent[]);
let t = AuthAccountState.data().iso639Code;

AuthAccountState.data.map((authAccount) => {
	if (t === authAccount.iso639Code && AppMenuComponents().length > 0) {
		return;
	}

	t = authAccount.iso639Code;

	AppMenuComponents([
		{
			icon: Icons.SignIn,
			link: "signin",
			name: AuthAccountState.translate(WebGlobalActionSignIn),
			permitted: (): boolean => {
				return ! AppState.isSessionOnline();
			},
			requireOnline: true,
		},
		{
			icon: Icons.Calendar,
			link: "calendar",
			name: AuthAccountState.translate(ObjectCalendar),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Calendar) && ! GlobalState.hideComponentIncludes("Calendar");
			},
			requireOnline: false,
		},
		{
			icon: Icons.Bookmark,
			link: "bookmarks",
			name: AuthAccountState.translate(ObjectBookmarks),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Auth) && ! GlobalState.hideComponentIncludes("Bookmarks");
			},
			requireOnline: false,
			views: BookmarkState.data.map(() => {
				return [
					{
						icon: Icons.All,
						link: "/",
						matchExact: true,
						name: AuthAccountState.translate(WebGlobalAll),
					},
					{
						icon: Icons.More,
						items: BookmarkState.data.map((bookmarks) => {
							return bookmarks.filter((bookmark) => {
								return bookmark.authHouseholdID === null && bookmark.home;
							})
								.map((bookmark) => {
									return {
										...bookmark,
										...{
											link: BookmarkState.getLink(bookmark),
										},
									};
								});
						}),
						itemsIconFormatter: BookmarkState.getIcon,
						itemsRequireOnline: true,
						itemsUseID: true,
						link: "?filter=personal",
						matchExact: true,
						name: AuthAccountState.translate(WebGlobalPersonal),
					},
					{
						icon: Icons.More,
						items: BookmarkState.data.map((bookmarks) => {
							return bookmarks.filter((bookmark) => {
								return bookmark.authAccountID === null && bookmark.home;
							})
								.map((bookmark) => {
									return {
										...bookmark,
										...{
											link: BookmarkState.getLink(bookmark),
										},
									};
								});
						}),
						itemsIconFormatter: BookmarkState.getIcon,
						itemsRequireOnline: true,
						itemsUseID: true,
						link: "?filter=household",
						matchExact: true,
						name: AuthAccountState.translate(ObjectHousehold),
					},
				] as AppMenuComponentView[];
			}),
		},
		{
			icon: Icons.Budget,
			link: "budget",
			name: AuthAccountState.translate(ObjectBudget),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Budget) && ! GlobalState.hideComponentIncludes("Budget");
			},
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.BudgetCategory,
					link: "/categories",
					name: AuthAccountState.translate(ObjectCategories),
				},
				{
					icon: Icons.BudgetPayee,
					link: "/payees",
					name: AuthAccountState.translate(ObjectPayees),
				},
				{
					items: Stream<AppMenuComponentViewItem[]>([
						{
							link: "/budget/charts/categories",
							name: AuthAccountState.translate(WebGlobalBudgetChartsSpendingByCategory),
						},
						{
							link: "/budget/charts/payees",
							name: AuthAccountState.translate(WebGlobalBudgetChartsSpendingByPayee),
						},
						{
							link: "/budget/charts/income-expense",
							name: AuthAccountState.translate(WebGlobalBudgetChartsIncomeExpense),
						},
					]),
					itemsIconFormatter: (b: AppMenuComponentViewItem): string => {
						switch (b.name) {
						case AuthAccountState.translate(WebGlobalBudgetChartsSpendingByCategory):
							return Icons.BudgetCategory;
						case AuthAccountState.translate(WebGlobalBudgetChartsSpendingByPayee):
							return Icons.BudgetPayee;
						case AuthAccountState.translate(WebGlobalBudgetChartsIncomeExpense):
							return Icons.TrendingUp;
						}

						return "";
					},
					itemsRequireOnline: true,
					link: "/charts",
					name: AuthAccountState.translate(WebGlobalBudgetCharts),
					requireOnline: true,
				},
				{
					colorFormatter: (b: BudgetAccount): string => {
						if (b.budgetTransactionAmount < 0) {
							return "var(--color_negative)";
						}
						return "var(--color_positive)";
					},
					countFormatterView: (b: BudgetAccount): string => {
						return Currency.toString(b.budgetTransactionAmount, AuthHouseholdState.findID(b.authHouseholdID).preferences.currency);
					},
					icon: Icons.More,
					items: BudgetAccountState.data.map((accounts: AppMenuComponentViewItem[]) => {
						return accounts.filter((account: AppMenuComponentViewItem) => {
							return account.hidden === false;
						});
					}),
					itemsIconFormatter: (b: BudgetAccount): string => {
						if (b.icon === "") {
							return Icons.BudgetAccount;
						}

						return b.icon;
					},
					itemsRequireOnline: true,
					itemsUseID: true,
					link: "/accounts",
					matchExact: true,
					name: AuthAccountState.translate(ObjectAccounts),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.Cook,
			link: "cook",
			name: AuthAccountState.translate(ObjectCook),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Cook) && ! GlobalState.hideComponentIncludes("Cook");
			},
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.CookRecipe,
					link: "/recipes",
					name: AuthAccountState.translate(ObjectRecipes),
				},
				{
					icon: Icons.Calendar,
					link: "/calendar",
					linkOnly: true,
					name: AuthAccountState.translate(ObjectMealPlans),
				},
				{
					icon: Icons.CookMealTime,
					link: "/meal-times",
					name: AuthAccountState.translate(ObjectMealTimes),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.Health,
			link: "health",
			name: AuthAccountState.translate(ObjectHealth),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Health) && ! GlobalState.hideComponentIncludes("Health");
			},
			requireOnline: false,
			views: AuthHouseholdState.data.map(() => {
				const members = Stream([
					AuthHouseholdState.findMember(AuthAccountState.data().id),
				]);

				const households: string[] = [];

				if (AuthSessionState.data().permissionsHouseholds !== null) {
					for (const household of AuthSessionState.data().permissionsHouseholds!) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
						if (household.permissions.auth === PermissionEnum.Edit) {
							households.push(`${household.authHouseholdID}`);
						}
					}
				}

				members()
					.push(...AuthHouseholdState.membersChildren()
						.filter((member) => {
							return households.includes(`${member.authHouseholdID}`);
						}));

				m.redraw();

				return [
					{
						icon: Icons.Calendar,
						link: "/calendar",
						linkOnly: true,
						name: AuthAccountState.translate(ObjectLogs),
					},
					{
						icon: members().length > 1 ?
							undefined :
							Icons.HealthItemInput,
						items: members().length > 1 ?
							members :
							undefined,
						itemsIcon: members().length > 1 ?
							Icons.HealthItemInput :
							undefined,
						link: "/items?type=inputs&",
						name: AuthAccountState.translate(ObjectInputs),
						query: "id",
					},
					{
						icon: members().length > 1 ?
							undefined :
							Icons.HealthItemOutput,
						items: members().length > 1 ?
							members :
							undefined,
						itemsIcon: members().length > 1 ?
							Icons.HealthItemOutput :
							undefined,
						link: "/items?type=outputs&",
						name: AuthAccountState.translate(ObjectOutputs),
						query: "id",
					},
				] as AppMenuComponentView[];
			}),
		},
		{
			icon: Icons.Inventory,
			link: "inventory",
			name: AuthAccountState.translate(ObjectInventory),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Inventory) && ! GlobalState.hideComponentIncludes("Inventory");
			},
			requireOnline: false,
			views: InventoryCollectionState.data.map((collections) => {
				const groupings = [] as AppMenuComponentView[];
				const views = [] as AppMenuComponentView[];

				for (const collection of collections) {
					if (collection.grouping === "") {
						views.push(InventoryCollectionState.toView(collection));
					} else {
						const i = groupings.findIndex((v) => {
							return v.name === collection.grouping;
						});

						if (i < 0) {
							groupings.push({
								countFormatterView: (i: AppMenuComponentViewItem): string => {
									return `${InventoryCollectionState.counts()[i.id as string]}`;
								},
								items: Stream([
									InventoryCollectionState.toView(collection) as AppMenuComponentViewItem,
								]),
								link: "/",
								name: collection.grouping,
							});
						} else {
							groupings[i].items!([ // eslint-disable-line @typescript-eslint/no-non-null-assertion
								...groupings[i].items!(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
								InventoryCollectionState.toView(collection),
							]);
						}
					}
				}

				Sort(groupings, {
					property: "name",
				});

				m.redraw();

				return [
					{
						icon: Icons.InventoryCollection,
						link: "/",
						matchExact: true,
						name: AuthAccountState.translate(WebGlobalAllCollections),
					},
					{
						icon: Icons.All,
						link: "/all",
						matchExact: true,
						name: AuthAccountState.translate(WebGlobalAllItems),
					},
					...views,
					...groupings,
				];
			}),
		},
		{
			icon: Icons.Notes,
			link: "notes",
			name: AuthAccountState.translate(ObjectNotes),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Notes) && ! GlobalState.hideComponentIncludes("Notes");
			},
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.All,
					link: "/",
					matchExact: true,
					name: AuthAccountState.translate(WebGlobalAll),
				},
				{
					icon: Icons.More,
					link: "/personal",
					matchExact: true,
					name: AuthAccountState.translate(WebGlobalPersonal),
					nested: {
						data: NotesPageState.personal as unknown as Stream<AppMenuNestedData[]>,
						href: (page: NotesPage): string => {
							return `/notes/${page.authAccountID === null ?
								"household" :
								"personal"}/${page.id}`;
						},
						icon: Icons.Notes,
						isCollapsed: (id: NullUUID): boolean => {
							return AuthAccountState.data().collapsedNotesPages.includes(`${id}`);
						},
						onclickCollapse: async (id: NullUUID): Promise<void | Err> => {
							return AuthAccountState.collapseNotesPage(id);
						},
						pathPrefix: "/notes",
					},
				},
				{
					icon: Icons.More,
					link: "/household",
					matchExact: true,
					name: AuthAccountState.translate(ObjectHousehold),
					nested: {
						data: NotesPageState.household as unknown as Stream<AppMenuNestedData[]>,
						href: (page: NotesPage): string => {
							return `/notes/${page.authAccountID === null ?
								"household" :
								"personal"}/${page.id}`;
						},
						icon: Icons.Notes,
						isCollapsed: (id: NullUUID): boolean => {
							return AuthAccountState.data().collapsedNotesPages.includes(`${id}`);
						},
						onclickCollapse: async (id: NullUUID): Promise<void | Err> => {
							return AuthAccountState.collapseNotesPage(id);
						},
						pathPrefix: "/notes",
					},
				},
			] as AppMenuComponentView[]),
		},
		{
			countFormatter: (): number => {
				return PlanTaskState.getCountToday();
			},
			icon: Icons.Plan,
			link: "plan",
			name: AuthAccountState.translate(ObjectPlan),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Plan) && ! GlobalState.hideComponentIncludes("Plan");
			},
			requireOnline: false,
			views: Stream([
				{
					countFormatter: (): number => {
						return PlanTaskState.getCountToday();
					},
					icon: Icons.Today,
					link: "/tasks?filter=today",
					name: AuthAccountState.translate(WebGlobalToday),
				},
				{
					countFormatter: (): number => {
						return PlanTaskState.getCountUpcoming();
					},
					icon: Icons.Upcoming,
					link: "/tasks?filter=upcoming",
					name: AuthAccountState.translate(WebGlobalUpcoming),
				},
				{
					icon: Icons.All,
					link: "/tasks",
					matchExact: true,
					name: AuthAccountState.translate(WebGlobalAll),
				},
				{
					icon: Icons.Template,
					link: "/tasks?filter=templates",
					name: AuthAccountState.translate(WebGlobalTemplates),
				},
				{
					countFormatter: PlanTaskState.personal.map((tasks) => {
						return tasks.filter((task) => {
							return task.planProjectID === null && ! task.done;
						}).length;
					}),
					icon: Icons.More,
					link: "/tasks?filter=personal",
					name: AuthAccountState.translate(WebGlobalPersonal),
					nested: {
						data: PlanProjectState.personal as unknown as Stream<AppMenuNestedData[]>,
						findCount: (project: PlanProject): number => {
							return PlanProjectState.findCount(project);
						},
						href: (project: PlanProject): string => {
							return `/plan/tasks?project=${project.id}`;
						},
						icon: Icons.PlanProject,
						isCollapsed: (id: NullUUID): boolean => {
							return AuthAccountState.data().collapsedPlanProjects.includes(`${id}`);
						},
						onclickCollapse: async (id: NullUUID): Promise<void | Err> => {
							return AuthAccountState.collapsePlanProject(id);
						},
						pathPrefix: "/plan",
					},
				},
				{
					countFormatter: PlanTaskState.household.map((tasks) => {
						return tasks.filter((task) => {
							return task.planProjectID === null && ! task.done;
						}).length;
					}),
					icon: Icons.More,
					link: "/tasks?filter=household",
					name: AuthAccountState.translate(ObjectHousehold),
					nested: {
						data: PlanProjectState.household as unknown as Stream<AppMenuNestedData[]>,
						findCount: (project: PlanProject): number => {
							return PlanProjectState.findCount(project);
						},
						href: (project: PlanProject): string => {
							return `/plan/tasks?project=${project.id}`;
						},
						icon: Icons.PlanProject,
						isCollapsed: (id: NullUUID): boolean => {
							return AuthAccountState.data().collapsedPlanProjects.includes(`${id}`);
						},
						onclickCollapse: async (id: NullUUID): Promise<void | Err> => {
							return AuthAccountState.collapsePlanProject(id);
						},
						pathPrefix: "/plan",
					},
				},
			] as AppMenuComponentView[]),
		},
		{
			countFormatter: (): number => {
				return RewardCardState.getInProgress(RewardCardState.data()).length;
			},
			icon: Icons.Reward,
			link: "reward",
			name: AuthAccountState.translate(ObjectReward),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Reward) && ! GlobalState.hideComponentIncludes("Reward");
			},
			requireOnline: false,
			views: Stream([
				{
					countFormatter: (): number => {
						return RewardCardState.getRedeemable().length;
					},
					icon: Icons.Redeemable,
					link: "/redeemable",
					name: AuthAccountState.translate(WebFormOverlayRewardCardRedeemable),
				},
				{
					countFormatter: (): number => {
						return RewardCardState.getInProgress().length;
					},
					icon: Icons.InProgress,
					link: "/inprogress",
					name: AuthAccountState.translate(WebGlobalInProgress),
				},
				{
					countFormatter: (): number => {
						return RewardCardState.findSent(RewardCardState.data()).length;
					},
					countFormatterView: (t: Tag): string => {
						return `${t.count}`;
					},
					icon: Icons.Send,
					link: "/sent",
					name: AuthAccountState.translate(WebGlobalSent),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.SecretsVault,
			link: "secrets",
			name: AuthAccountState.translate(ObjectSecrets),
			onclick: async (): Promise<void> => {
				if (AuthAccountState.privateKey().key === "") {
					m.route.set("/settings/account?security");

					if (AppState.getSessionDisplay() !== DisplayEnum.XLarge) {
						AppState.toggleLayoutAppMenuOpen(false);
					}
				}
			},
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Secrets) && ! GlobalState.hideComponentIncludes("Secrets");
			},
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.SecretsVault,
					link: "/",
					matchExact: true,
					name: AuthAccountState.translate(WebGlobalAllVaults),
				},
				SecretsVaultState.data().length > 0 && AuthAccountState.privateKey().key !== "" ?
					{
						icon: Icons.SecretsValue,
						link: "/all",
						matchExact: true,
						name: AuthAccountState.translate(WebGlobalAllValues),
					} :
					null,
				{
					icon: Icons.More,
					items: SecretsVaultState.data.map((vaults) => {
						return vaults.filter((vault) => {
							return vault.authHouseholdID === null;
						});
					}),
					itemsIconFormatter: SecretsVaultState.getIcon,
					itemsRequireOnline: true,
					itemsUseID: true,
					link: "?filter=personal",
					matchExact: true,
					name: AuthAccountState.translate(WebGlobalPersonal),
				},
				{
					icon: Icons.More,
					items: SecretsVaultState.data.map((vaults) => {
						return vaults.filter((vault) => {
							return vault.authAccountID === null;
						});
					}),
					itemsIconFormatter: SecretsVaultState.getIcon,
					itemsRequireOnline: true,
					itemsUseID: true,
					link: "?filter=household",
					matchExact: true,
					name: AuthAccountState.translate(ObjectHousehold),
				},
			] as AppMenuComponentView[]),
		},
		{
			countFormatter: (): number => {
				return ShopItemState.countItems();
			},
			icon: Icons.Shop,
			link: "shop",
			name: AuthAccountState.translate(ObjectShop),
			permitted: (): boolean => {
				return GlobalState.permitted(PermissionComponentsEnum.Shop) && ! GlobalState.hideComponentIncludes("Shop");
			},
			requireOnline: false,
			views: AuthSessionState.data.map(() => {
				return [
					Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Shop, PermissionEnum.View) ?
						{
							icon: Icons.ShopCategory,
							link: "/categories",
							name: AuthAccountState.translate(ObjectCategories),
						} :
						null,
					{
						icon: Icons.Recurring,
						link: "/staples",
						name: AuthAccountState.translate(ObjectStaples),
					},
					Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Shop, PermissionEnum.View) ?
						{
							icon: Icons.BudgetPayee,
							link: "/stores",
							name: AuthAccountState.translate(ObjectStores),
						} :
						null,
					{
						countFormatter: (): number => {
							return ShopItemState.countItems();
						},
						countFormatterView: (s: BudgetPayee): string => {
							return `${ShopItemState.countItems(s.id)}`;
						},
						icon: Icons.More,
						items: Stream.lift((_item, payees) => {
							return payees.filter((payee) => { // eslint-disable-line @typescript-eslint/consistent-type-assertions
								return payee.shopStore === true && ShopItemState.countItems(payee.id) > 0;
							}) as AppMenuComponentViewItem[];
						}, ShopItemState.data, BudgetPayeeState.data),
						itemsIconFormatter: (b: BudgetPayee): string => {
							if (b.icon === "") {
								return Icons.BudgetPayee;
							}

							return b.icon;
						},
						link: "/items",
						matchExact: true,
						name: AuthAccountState.translate(ObjectListPickUp),
						query: "?store",
					},
					{
						countFormatterView: (s: ShopList): string => {
							return `${s.shopItemCount}`;
						},
						icon: Icons.More,
						items: ShopListState.data as unknown as Stream<AppMenuComponentViewItem[]>, // eslint-disable-line @typescript-eslint/consistent-type-assertions
						itemsIconFormatter: (s: ShopList): string => {
							if (s.icon !== "") {
								return s.icon;
							}

							if (s.authAccountID === null) {
								return Icons.Household;
							}

							return Icons.Personal;
						},
						itemsUseID: true,
						link: "/lists",
						matchExact: true,
						name: AuthAccountState.translate(ObjectLists),
					},
				] as AppMenuComponentView[];
			}),
		},
		{
			icon: Icons.Settings,
			link: "settings",
			name: AuthAccountState.translate(WebGlobalSettings),
			permitted: AppState.isSessionAuthenticated,
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.Personal,
					link: "/account",
					name: AuthAccountState.translate(ObjectAccount),
				},
				{
					icon: Icons.Notification,
					link: "/notifications",
					name: AuthAccountState.translate(ObjectNotifications),
				},
				{
					icon: Icons.Session,
					link: "/sessions",
					name: AuthAccountState.translate(ObjectSessions),
				},
				{
					icon: Icons.More,
					items: AuthHouseholdState.data as unknown as Stream<AppMenuComponentViewItem[]>,
					itemsIcon: Icons.Household,
					itemsUseID: true,
					link: "/households",
					matchExact: true,
					name: AuthAccountState.translate(ObjectHouseholds),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.Subscription,
			link: "subscription",
			name: AuthAccountState.translate(WebGlobalSubscription),
			permitted: (): boolean => {
				return ! AuthAccountState.isDemo() && Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Auth, PermissionEnum.Edit);
			},
			requireOnline: true,
		},
		{
			countFormatter: (): number => {
				let total = 5;

				for (const household of AuthHouseholdState.data()) {
					if (Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Auth, PermissionEnum.Edit, household.id) && household.featureVotes !== null) {
						for (const vote of household.featureVotes) {
							total -= vote.amount;
						}
					}
				}

				return total;
			},
			icon: Icons.RatingUnselect,
			link: "feature-voting",
			name: AuthAccountState.translate(WebGlobalFeatureVoting),
			permitted: (): boolean => {
				return InfoState.data().featureVotes !== undefined && InfoState.data().featureVotes!.length > 0 && Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Auth, PermissionEnum.Edit); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			},
			requireOnline: true,
		},
		{
			icon: Icons.About,
			link: "about",
			name: AuthAccountState.translate(WebGlobalAbout),
			permitted: (): boolean => {
				return true;
			},
			requireOnline: false,
			views: Stream([
				{
					icon: Icons.AboutNew,
					link: "https://homechart.app/blog/",
					name: AuthAccountState.translate(WebGlobalAboutWhatsNew),
				},
				{
					icon: Icons.Roadmap,
					link: "https://github.com/orgs/candiddev/projects/6/views/36",
					name: AuthAccountState.translate(WebGlobalAboutRoadmap),
				},
				{
					icon: Icons.AboutAPI,
					link: `${document.location.origin}/api/docs`,
					name: AuthAccountState.translate(WebGlobalAboutAPIReference),
				},
				{
					icon: Icons.AboutOSS,
					link: "/osslicenses",
					name: AuthAccountState.translate(WebGlobalAboutOSL),
				},
				{
					icon: Icons.AboutPolicy,
					link: "/terms",
					name: AuthAccountState.translate(WebGlobalAboutTermsService),
				},
				{
					icon: Icons.AboutPolicy,
					link: "/privacy",
					name: AuthAccountState.translate(WebGlobalAboutPrivacyPolicy),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.Admin,
			link: "admin",
			name: AuthAccountState.translate(WebGlobalAdmin),
			permitted: AppState.isSessionAdmin,
			requireOnline: true,
			views: Stream([
				{
					icon: Icons.Personal,
					link: "/accounts",
					name: AuthAccountState.translate(ObjectAccounts),
				},
				{
					icon: Icons.Household,
					link: "/households",
					name: AuthAccountState.translate(ObjectHouseholds),
				},
				{
					icon: Icons.Notification,
					link: "/notifications",
					name: AuthAccountState.translate(ObjectNotifications),
				},
			] as AppMenuComponentView[]),
		},
		{
			icon: Icons.Install,
			link: "",
			name: AuthAccountState.translate(WebGlobalInstallHomechart),
			onclick: async (): Promise<void> => {
				if (/ipad|iphone/.test(navigator.userAgent.toLowerCase())) {
					AppState.setLayoutAppAlert({
						message: AuthAccountState.translate(WebGlobalInstallHomechartiOS),
						persist: true,
					});
					return;
				}

				if (AppState.getSessionInstallPrompt() !== null) {
					return AppState.getSessionInstallPrompt()! // eslint-disable-line @typescript-eslint/no-non-null-assertion
						.prompt()
						.then(() => {
							AppState.setSessionInstallPrompt(null);
						});
				}
			},
			permitted: (): boolean => {
				return AppState.isSessionAuthenticated() && AppState.getSessionInstallPrompt() !== null || /ipad|iphone/.test(navigator.userAgent.toLowerCase());
			},
			requireOnline: false,
		},
		{
			icon: Icons.SwitchUser,
			link: "switch",
			name: AuthAccountState.translate(WebGlobalActionSignInChild),
			permitted: (): boolean => {
				return Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Auth, PermissionEnum.Edit) && AuthHouseholdState.membersChildren().length > 0;
			},
			requireOnline: true,
		},
		{
			icon: Icons.SignIn,
			link: "signout",
			name: AuthAccountState.translate(WebGlobalActionSignOut),
			permitted: (): boolean => {
				return ! AuthAccountState.isDemo();
			},
			requireOnline: false,
		},
		{
			icon: Icons.SignIn,
			link: "signout",
			name: AuthAccountState.translate(WebGlobalActionEndDemo),
			permitted: (): boolean => {
				return AuthAccountState.isDemo();
			},
			requireOnline: false,
		},
	]);

	m.redraw();
});
