import "modern-normalize/modern-normalize.css";
import "@lib/css/style.css";

import type { TelemetryOptions } from "@lib/services/Telemetry";
import type { AppPreferences } from "@lib/states/App";
import { AppState } from "@lib/states/App";
import { ColorEnum } from "@lib/types/Color";
import m from "mithril";

import { FormItemAutocomplete } from "./components/FormItemAutocomplete";
import { MarkdownLinks } from "./components/MarkdownLinks";
import Routes from "./routes";
import { API, apiEndpoint } from "./services/API";
import { AuthAccountState } from "./states/AuthAccount";
import { AuthSessionState } from "./states/AuthSession";
import { GlobalState } from "./states/Global";
import { InfoState } from "./states/Info";
import { TelemetryState } from "./states/Telemetry";
import { WebAppDemoWelcome1, WebAppDemoWelcome2 } from "./yaml8n";


// Register service worker
if ("serviceWorker" in navigator) {
	window.addEventListener("load", async () => { // eslint-disable-line @typescript-eslint/no-misused-promises
		return navigator.serviceWorker.register(process.env.NODE_ENV === "production"
			? "/sw.js"
			: "/dev-sw.js?dev-sw",
		{ type: process.env.NODE_ENV === "production"
			? "classic"
			: "module" },
		)
			.then((registration: ServiceWorkerRegistration) => {
				AppState.setSessionServiceWorkerRegistration(registration);
			});
	});
}

// Refresh service worker if new version is available
if (navigator.serviceWorker !== undefined && navigator.serviceWorker.controller !== undefined && navigator.serviceWorker.controller !== null) {
	navigator.serviceWorker.controller.onstatechange = (e: Event): void => {
		const sw = e.target as ServiceWorker; // eslint-disable-line @typescript-eslint/consistent-type-assertions
		if (sw.state === "redundant") {
			AppState.setLayoutAppAlertNewVersion();
		}
	};
}
// Listen for Add To Homescreen
window.addEventListener("beforeinstallprompt", (e: Event) => {
	AppState.setSessionInstallPrompt(e as BeforeInstallPromptEvent); // eslint-disable-line @typescript-eslint/consistent-type-assertions
});

// Handle errors
window.addEventListener("unhandledrejection", (e) => {
	setTimeout(async () => {
		if (AppState.isSessionOnline()) {
			return TelemetryState.createError(e.reason.stack);
		}
	}, 0);
});

// Get errors and send to server
window.onerror = (_message, _source, _linenumber, _columnnumber, error): boolean => {
	setTimeout(async () => {
		if (error !== undefined && error.stack !== undefined) {
			if (AppState.isSessionOnline()) {
				return TelemetryState.createError(error.stack);
			}
		}
	}, 0);
	return false;
};

GlobalState.init();
AppState.init(
	// motd
	() => {
		if (AuthAccountState.isDemo()) {
			return `**${AuthAccountState.translate(WebAppDemoWelcome1)}**  ${AuthAccountState.translate(WebAppDemoWelcome2)}`;
		}

		return InfoState.data().motd;
	},
	// oncreate
	async () => {
		// Check if this is the first time the app has been opened
		await AuthSessionState.load();

		// Attempt to sign in in case we're using SSO via HTTP headers
		if (process.env.NODE_ENV !== "test") {
			await AuthAccountState.load();
			await GlobalState.signIn()
				.catch(() => { });
		}
	},
	// ondebug
	(): TelemetryOptions => {
		API.toggleDebug();

		return {
			endpoint: `${apiEndpoint().hostname}`,
			path: "/api/v1/telemetry/traces",
			serviceName: "homechart-ui",
		};
	},
	// parserFormItemAutocomplete
	FormItemAutocomplete,
	// parserMarkdown
	MarkdownLinks,
	// preferences
	AuthAccountState.data.map((account) => {
		return {
			colorAccent: account.preferences.colorAccent === ColorEnum.Default ?
				ColorEnum.Red :
				account.preferences.colorAccent,
			colorNegative: account.preferences.colorNegative === ColorEnum.Default ?
				ColorEnum.Pink :
				account.preferences.colorNegative,
			colorPositive: account.preferences.colorPositive === ColorEnum.Default ?
				ColorEnum.Teal :
				account.preferences.colorPositive,
			colorPrimary: account.preferences.colorPrimary === ColorEnum.Default ?
				ColorEnum.Yellow :
				account.preferences.colorPrimary,
			colorSecondary: account.preferences.colorSecondary === ColorEnum.Default ?
				ColorEnum.Blue :
				account.preferences.colorSecondary,
			darkMode: account.preferences.darkMode,
			formatDateOrder: account.preferences.formatDateOrder,
			formatDateSeparator: account.preferences.formatDateSeparator,
			formatTime24: account.preferences.formatTime24,
			iso639Code: account.iso639Code,
		} as AppPreferences;
	}),
	// product
	"Homechart",
);

m.route(document.body, "/", Routes);
