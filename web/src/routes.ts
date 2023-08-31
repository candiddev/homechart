import { App } from "@lib/layout/App";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import type { BuildRouteOptions } from "@lib/utilities/BuildRoute";
import { BuildRoute } from "@lib/utilities/BuildRoute";
import type { RouteLinkAttrs } from "mithril";
import m from "mithril";

import { FormContactUs } from "./components/FormContactUs";
import { Logo } from "./components/Logo";
import { AppMenuComponents } from "./layout/AppMenuComponents";
import { AppSearcher } from "./layout/AppSearcher";
import { AppToolbarActions } from "./layout/AppToolbarActions";
import { API } from "./services/API";
import { IndexedDB } from "./services/IndexedDB";
import { AuthAccountState } from "./states/AuthAccount";
import { AuthSessionState } from "./states/AuthSession";
import { GlobalState } from "./states/Global";
import { OIDCState } from "./states/OIDC";
import { SSEState } from "./states/SSE";

export const routeOptions: BuildRouteOptions = {
	contactUs: FormContactUs,
	logo: Logo,
	menuComponents: AppMenuComponents,
	onrouteinit: async (args): Promise<void> => {
		if (args.emailaddress !== undefined && args.password !== undefined) {
			AuthAccountState.data().emailAddress = args.emailaddress;
			AuthAccountState.data().password = args.password;

			return AuthAccountState.createSession(AuthAccountState.data(), await API.getHostname())
				.then(async () => {
					return GlobalState.signIn();
				});
		}
	},
	searcher: AppSearcher,
	toolbarActions: AppToolbarActions,
};

export default {
	"/": {
		onmatch: (args: any): void => { // eslint-disable-line @typescript-eslint/no-explicit-any
			if (args.referral !== undefined) {
				localStorage.setItem("referral", args.referral);
			}
		},
		render: (): m.Children => {
			return m(App, {
				...routeOptions,
				...{
					hideHeader: true,
				},
			});
		},
	},
	"/about/osslicenses": BuildRoute(async () => {
		return (await import("./views/AboutOSSLicenses")).AboutOSSLicenses;
	}, {
		...routeOptions,
		...{
			public: true,
		},
	}),
	"/about/privacy": BuildRoute(async () => {
		return (await import("./views/AboutPrivacy")).AboutPrivacy;
	}, {
		...routeOptions,
		...{
			defaultTitle: true,
			public: true,
		},
	}),
	"/about/terms": BuildRoute(async () => {
		return (await import("./views/AboutTermsOfService")).AboutTermsOfService;
	}, {
		...routeOptions,
		...{
			defaultTitle: true,
			public: true,
		},
	}),
	"/admin/accounts": BuildRoute(async () => {
		return (await import("./views/AdminAccounts")).AdminAccounts;
	}, routeOptions),
	"/admin/households": BuildRoute(async () => {
		return (await import("./views/AdminHouseholds")).AdminHouseholds;
	}, routeOptions),
	"/admin/notifications": BuildRoute(async () => {
		return (await import("./views/AdminNotifications")).AdminNotifications;
	}, routeOptions),
	"/bookmarks": BuildRoute(async () => {
		return (await import("./views/Bookmarks")).Bookmarks;
	}, routeOptions),
	"/bookmarks/:id": BuildRoute(async () => {
		return (await import("./views/BookmarksIframe")).BookmarksIframe;
	}, {
		...routeOptions,
		...{
			fullWidth: true,
		},
	}),
	"/budget/accounts": BuildRoute(async () => {
		return (await import("./views/BudgetAccounts")).BudgetAccounts;
	}, routeOptions),
	"/budget/accounts/:account": BuildRoute(async () => {
		return (await import("./views/BudgetTransactions")).BudgetTransactions;
	}, routeOptions),
	"/budget/categories": BuildRoute(async () => {
		return (await import("./views/BudgetCategories")).BudgetCategories;
	}, routeOptions),
	"/budget/categories/:yearMonth": BuildRoute(async () => {
		return (await import("./views/BudgetCategories")).BudgetCategories;
	}, routeOptions),
	"/budget/charts": {
		onmatch: (): void => {
			m.route.set("/budget/charts/categories", {}, {
				state: {
					key: Date.now(),
				},
			});
		},
	},
	"/budget/charts/:type": BuildRoute(async () => {
		return (await import("./views/BudgetCharts")).BudgetCharts;
	}, routeOptions),
	"/budget/payees": BuildRoute(async () => {
		return (await import("./views/BudgetPayees")).BudgetPayees;
	}, routeOptions),
	"/budget/transactions": BuildRoute(async () => {
		return (await import("./views/BudgetTransactions")).BudgetTransactions;
	}, routeOptions),
	"/calendar": BuildRoute(async () => {
		return (await import("./views/Calendar")).Calendar;
	}, routeOptions),
	"/cook/meal-times": BuildRoute(async () => {
		return (await import("./views/CookMealTimes")).CookMealTimes;
	}, routeOptions),
	"/cook/recipes": BuildRoute(async () => {
		return (await import("./views/CookRecipes")).CookRecipes;
	}, routeOptions),
	"/cook/recipes/:id": BuildRoute(async () => {
		return (await import("./views/CookRecipesID")).CookRecipesID;
	}, {
		...routeOptions,
		...{
			public: true,
		},
	}),
	"/demo": {
		onmatch: async (): Promise<void> => {
			const hostname = await API.getHostname();

			setTimeout(async () => {
				return IndexedDB.clear()
					.then(async () => {
						API.setHostname(hostname);

						return API.read(`/api/v1/auth/demo?code=${AuthAccountState.data().iso639Code}&timezone=${Intl.DateTimeFormat()
							.resolvedOptions().timeZone}`, {});
					})
					.then(async (response) => {
						if (!IsErr(response) && AuthSessionState.inResponse(response)) {
							return API.setAuth({
								id: response.dataValue[0].id,
								key: response.dataValue[0].key,
							})
								.then(async () => {
									return AuthSessionState.set(response.dataValue[0]);
								})
								.then(async () => {
									return GlobalState.signIn();
								});
						}

						return GlobalState.signOut();
					});
			}, 100);
		},
		render: (): m.Children => {
			return m(App, {
				...routeOptions,
				...{
					hideHeader: true,
					public: true,
				},
			});
		},
	},
	"/feature-voting": BuildRoute(async () => {
		return (await import("./views/FeatureVoting")).FeatureVoting;
	}, routeOptions),
	"/health/items": BuildRoute(async () => {
		return (await import("./views/HealthItems")).HealthItems;
	}, routeOptions),
	"/help/markdown": BuildRoute(async () => {
		return (await import("./views/HelpMarkdown")).HelpMarkdown;
	}, routeOptions),
	"/home": BuildRoute(async () => {
		return (await import("./views/Home")).Home;
	}, routeOptions),
	"/inventory": BuildRoute(async () => {
		return (await import("./views/InventoryCollections")).InventoryCollections;
	}, routeOptions),
	"/inventory/:collection": BuildRoute(async () => {
		return (await import("./views/InventoryItems")).InventoryItems;
	}, routeOptions),
	"/notes": BuildRoute(async () => {
		return (await import("./views/NotesPages")).NotesPages;
	}, routeOptions),
	"/notes/:tag": BuildRoute(async () => {
		return (await import("./views/NotesPages")).NotesPages;
	}, routeOptions),
	"/notes/:tag/:id": BuildRoute(async () => {
		return (await import("./views/NotesPagesID")).NotesPagesID;
	}, routeOptions),
	"/notes/:tag/:id/versions": BuildRoute(async () => {
		return (await import("./views/NotesPagesIDVersions")).NotesPagesIDVersions;
	}, routeOptions),
	"/oauth": BuildRoute(async () => {
		return (await import("./views/OAuth")).OAuth;
	}, routeOptions),
	"/oidc": {
		onmatch: async (args: RouteLinkAttrs): Promise<void> => {
			return OIDCState.readResponse(args.code, args.provider, args.state)
				.catch(async () => {
					return GlobalState.signOut();
				});
		},
		render: (): m.Children => {
			return m(App, {
				...routeOptions,
				...{
					hideHeader: true,
					public: true,
				},
			});
		},
	},
	"/payment": BuildRoute(async () => {
		return (await import("./views/Payment")).Payment;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
			public: true,
		},
	}),
	"/plan/tasks": BuildRoute(async () => {
		return (await import("./views/PlanTasks")).PlanTasks;
	}, routeOptions),
	"/reset": BuildRoute(async () => {
		return (await import("./views/ResetPassword")).ResetPassword;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
			public: true,
		},
	}),
	"/reward/:filter": BuildRoute(async () => {
		return (await import("./views/RewardCards")).RewardCards;
	}, routeOptions),
	"/secrets": BuildRoute(async () => {
		return (await import("./views/SecretsVaults")).SecretsVaults;
	}, routeOptions),
	"/secrets/:id": BuildRoute(async () => {
		return (await import("./views/SecretsValues")).SecretsValues;
	}, routeOptions),
	"/settings/account": BuildRoute(async () => {
		return (await import("./views/SettingsAccount")).SettingsAccount;
	}, routeOptions),
	"/settings/households": BuildRoute(async () => {
		return (await import("./views/SettingsHouseholds")).SettingsHouseholds;
	}, routeOptions),
	"/settings/households/:id": BuildRoute(async () => {
		return (await import("./views/SettingsHouseholdsID")).SettingsHouseholdsID;
	}, routeOptions),
	"/settings/notifications": BuildRoute(async () => {
		return (await import("./views/SettingsNotifications")).SettingsNotifications;
	}, routeOptions),
	"/settings/sessions": BuildRoute(async () => {
		return (await import("./views/SettingsSessions")).SettingsSessions;
	}, routeOptions),
	"/setup": BuildRoute(async () => {
		return (await import("./views/Setup")).Setup;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
		},
	}),
	"/setup/:target": BuildRoute(async () => {
		return (await import("./views/Setup")).Setup;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
		},
	}),
	"/share": BuildRoute(async () => {
		return (await import("./views/Share")).Share;
	}, routeOptions),
	"/shop/categories": BuildRoute(async () => {
		return (await import("./views/ShopCategories")).ShopCategories;
	}, routeOptions),
	"/shop/items": BuildRoute(async () => {
		return (await import("./views/ShopItems")).ShopItems;
	}, routeOptions),
	"/shop/lists": BuildRoute(async () => {
		return (await import("./views/ShopLists")).ShopLists;
	}, routeOptions),
	"/shop/lists/:list": BuildRoute(async () => {
		return (await import("./views/ShopItems")).ShopItems;
	}, routeOptions),
	"/shop/staples": BuildRoute(async () => {
		return (await import("./views/ShopStaples")).ShopStaples;
	}, routeOptions),
	"/shop/stores": BuildRoute(async () => {
		return (await import("./views/ShopStores")).ShopStores;
	}, routeOptions),
	"/signin": BuildRoute(async () => {
		return (await import("./views/SignIn")).SignIn;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
			public: true,
		},
	}),
	"/signout": {
		onmatch: async (): Promise<void> => {
			SSEState.reset();
			return AuthSessionState.delete()
				.then(async () => {
					return GlobalState.signOut();
				})
				.catch(async () => {
					return GlobalState.signOut();
				});
		},
		render: (): m.Children => {
			return m(App, {
				...routeOptions,
				...{
					hideHeader: true,
					public: true,
				},
			});
		},
	},
	"/signup": BuildRoute(async () => {
		return (await import("./views/SignIn")).SignIn;
	}, {
		...routeOptions,
		...{
			hideHeader: true,
			public: true,
		},
	}),
	"/subscription": BuildRoute(async () => {
		return (await import("./views/Subscription")).Subscription;
	}, routeOptions),
	"/subscription/:household": BuildRoute(async () => {
		return (await import("./views/Subscription")).Subscription;
	}, routeOptions),
	"/switch": BuildRoute(async () => {
		return (await import("./views/Switch")).Switch;
	}, routeOptions),
	"/verify": {
		onmatch: async (args: m.RouteLinkAttrs): Promise<void | Err> => {
			return AuthAccountState.updateVerify(args.id, args.token);
		},
		render: (): m.Children => {
			return m(App, {
				...routeOptions,
				...{
					hideHeader: true,
					public: true,
				},
			});
		},
	},
};
