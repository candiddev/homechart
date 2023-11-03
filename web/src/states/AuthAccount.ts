import { Key, KeyTypeAES128, KeyTypeRSA2048Private, NewKey, ParseEncryptedValue, ParseKey } from "@lib/encryption/Encryption";
import { NewPBDKF2AES128Key } from "@lib/encryption/PBDKF2";
import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDateOrderEnum, CivilDateSeparatorEnum } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";
import { OIDCProviderTypeEnum } from "@lib/types/OIDCProviderType";
import type { UserAgent } from "@lib/types/UserAgent";
import { getUserAgent } from "@lib/types/UserAgent";
import { ArrayBufferToBase64 } from "@lib/utilities/ArrayBuffer";
import { Clone } from "@lib/utilities/Clone";
import { PushPopStringArray } from "@lib/utilities/PushPopStringArray";
import { RandString } from "@lib/utilities/RandString";
import m from "mithril";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import { IndexedDB } from "../services/IndexedDB";
import { DataTypeEnum } from "../types/DataType";
import type { Permissions, PermissionsHousehold } from "../types/Permission";
import { Permission } from "../types/Permission";
import type { Translation } from "../yaml8n";
import { ObjectAccountCreated, ObjectAccountDeleted, ObjectAccountUpdated, ObjectAccountVerified, Translate, WebAlertWebCrypto, WebAuthAccountPasswordReset, WebAuthAccountVerificationSent, WebAuthAccountVerifyEmail, WebGlobalActionResend } from "../yaml8n";
import { AuthSessionState } from "./AuthSession";
import { DataManager } from "./Data";


export interface AuthAccount {
	child: boolean,
	collapsedNotesPages: string[],
	collapsedPlanProjects: string[],
	collapsedPlanTasks: string[],
	created: NullTimestamp,
	dailyAgendaNext: NullTimestamp,
	dailyAgendaTime: string,
	emailAddress: string,
	hideCalendarICalendars: string[],
	icalendarID: NullUUID,
	id: NullUUID,
	iso639Code: string,
	lastActivity: NullTimestamp,
	name: string,
	oidcCode: string,
	oidcProviderType: OIDCProviderTypeEnum,
	password: string,
	passwordResetToken: NullUUID,
	permissionsAccount: Permissions,
	permissionsHouseholds: PermissionsHousehold[] | null,
	preferences: AuthAccountPreferences,
	primaryAuthHouseholdID: NullUUID,
	privateKeys: AuthAccountPrivateKey[],
	publicKey: string,
	rememberMe?: boolean,
	selfHostedID?: NullUUID,
	setup: boolean,
	subscriptionReferrerCode: string,
	timeZone: string,
	tosAccepted: boolean,
	totpBackup: string,
	totpCode: string,
	totpEnabled: boolean,
	totpQR: string,
	totpSecret: string,
	updated: NullTimestamp,
	userAgent: UserAgent,
	verified: boolean,
}

interface AuthAccountPreferences {
	[key: string]: AuthAccountPreferencesNotificationsHouseholds[] | boolean | number | string[] | null | undefined,
	colorAccent: ColorEnum,
	colorNegative: ColorEnum,
	colorPositive: ColorEnum,
	colorPrimary: ColorEnum,
	colorSecondary: ColorEnum,
	darkMode: boolean,
	formatDateOrder: CivilDateOrderEnum,
	formatDateSeparator: CivilDateSeparatorEnum,
	formatTime24: boolean,
	formatWeek8601: boolean,
	hideCalendarBudgetRecurrences: boolean,
	hideCalendarCookMealPlans: boolean,
	hideCalendarEvents: boolean,
	hideCalendarHealthLogs: string[],
	hideCalendarPlanTasks: boolean,
	hideComponents: string[],
	ignoreDeviceAgenda: boolean,
	ignoreDeviceCalendarEvent: boolean,
	ignoreDevicePlanTask: boolean,
	ignoreEmailAgenda: boolean,
	ignoreEmailCalendarEvent: boolean,
	ignoreEmailNewsletter: boolean,
	ignoreEmailPlanTask: boolean,
	notificationsHouseholds: AuthAccountPreferencesNotificationsHouseholds[] | null,
	showCalendarEventAstronomy: boolean,
	showCalendarEventHolidaysCA: boolean,
	showCalendarEventHolidaysUK: boolean,
	showCalendarEventHolidaysUS: boolean,
}

interface AuthAccountPreferencesNotificationsHouseholds {
	[key: string]: NullUUID | boolean,
	authHouseholdID: NullUUID,
	ignoreDeviceCalendarEvent: boolean,
	ignoreDeviceCookMealPlanCook: boolean,
	ignoreDeviceCookMealPlanPrep: boolean,
	ignoreDevicePlanTask: boolean,
	ignoreDevicePlanTaskComplete: boolean,
	ignoreEmailCalendarEvent: boolean,
	ignoreEmailCookMealPlanCook: boolean,
	ignoreEmailCookMealPlanPrep: boolean,
	ignoreEmailPlanTask: boolean,
}

type AuthAccountPrivateKeyProvider = string; // eslint-disable-line @typescript-eslint/no-type-alias

export const AuthAccountPrivateKeyProviderNone = "none" as AuthAccountPrivateKeyProvider;
export const AuthAccountPrivateKeyProviderPasswordPBKDF2 = "passwordPBKDF2" as AuthAccountPrivateKeyProvider;

export interface AuthAccountPrivateKey {
	key: string,
	name: string,
	provider: string,
}

export class AuthAccountManager extends DataManager<AuthAccount> {
	keys = this.data.map((authAccount) => {
		return authAccount.privateKeys;
	});
	privateKey = Stream(new Key("", "", ""));

	constructor (data?: AuthAccount) {
		super("/api/v1/auth/accounts", DataTypeEnum.AuthAccount, data);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean): void {
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

		AppState.setLayoutAppAlert({
			message: msg,
		}, hideAlert);
	}

	alertVerifyEmail (): void {
		AppState.setLayoutAppAlert({
			actions: [
				{
					name: AuthAccountState.translate(WebGlobalActionResend),
					onclick: async (): Promise<void> => {
						return this.readVerify();
					},
				},
			],
			message: AuthAccountState.translate(WebAuthAccountVerifyEmail),
		});
	}

	alertWebCrypto (err?: Err): void {
		if (window.location.protocol === "http:") {
			AppState.setLayoutAppAlert({
				message: AuthAccountState.translate(WebAlertWebCrypto),
				persist: true,
			});
		} else if (err !== undefined) {
			AppState.setLayoutAppAlert(err);
		}
	}

	async collapsePlanProject (id: NullUUID): Promise<void | Err> {
		const a = this.data();

		a.collapsedPlanProjects = PushPopStringArray(id, a.collapsedPlanProjects);

		return this.update(a, true);
	}

	async collapsePlanTask (id: NullUUID): Promise<void | Err> {
		const a = this.data();

		a.collapsedPlanTasks = PushPopStringArray(id, a.collapsedPlanTasks);

		return this.update(a, true);
	}

	async collapseNotesPage (id: NullUUID): Promise<void | Err> {
		const a = this.data();

		a.collapsedNotesPages = PushPopStringArray(id, a.collapsedNotesPages);

		return this.update(a, true);
	}

	async createAccount (account: AuthAccount, hostname: string): Promise<void | Err> {
		const err = API.setHostname(hostname);

		if (account.password !== "") {
			const keys = await NewKey(KeyTypeRSA2048Private);
			if (IsErr(keys)) {
				this.alertWebCrypto(keys);
			} else {
				const key = await this.newPrivateKeyPBKDF2(account.password, (keys.privateKey as Key).string());

				if (key !== undefined) {
					account.privateKeys = [
						{
							key: key,
							name: "Account Creation",
							provider: AuthAccountPrivateKeyProviderPasswordPBKDF2,
						},
					];
					account.publicKey = (keys.publicKey as Key).string();
				}
			}
		}

		if (err !== undefined) {
			return err;
		}

		return API.create(this.path, account)
			.then(async (response) => {
				if (IsErr(response)) {
					AppState.setLayoutAppAlert(response);
					return response;
				}

				if (AuthSessionState.inResponse(response)) {
					const err = await API.setAuth({
						id: response.dataValue[0].id,
						key: response.dataValue[0].key,
					});

					if (err !== undefined) {
						return err;
					}

					AppState.setSessionRedirect("/setup");

					return AuthSessionState.set(response.dataValue[0]);
				}

				return ErrUnknownResponse;
			});
	}

	async createReset (account: AuthAccount): Promise<void> {
		return API.create("/api/v1/auth/reset", account)
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(WebAuthAccountPasswordReset),
				});
			});
	}

	async createSession (account: AuthAccount, hostname: string): Promise<void | Err> {
		API.setHostname(hostname);

		return API.create("/api/v1/auth/signin", account)
			.then(async (response) => {
				if (IsErr(response)) {
					return response;
				}

				if (AuthSessionState.inResponse(response)) {
					await API.setAuth({
						id: response.dataValue[0].id,
						key: response.dataValue[0].key,
					});

					return AuthSessionState.set(response.dataValue[0]);
				}

				return ErrUnknownResponse;
			});
	}

	async createTOTP (): Promise<AuthAccount | Err> {
		return API.create(`${this.path}/${this.data().id}/totp`)
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (this.inResponse(response)) {
					return response.dataValue[0];
				}

				return ErrUnknownResponse;
			});
	}

	async decryptPrivateKeys (password: string, remember?: boolean): Promise<void> {
		if (this.privateKey().key !== "") {
			return;
		}

		await this.loadPrivateKey();

		if (this.privateKey().key === "") {
			for (let i = 0; i < this.data().privateKeys.length; i++) {
				const e = ParseEncryptedValue(this.data().privateKeys[i].key);

				if (!IsErr(e)) {
					if (this.data().privateKeys[i].provider === AuthAccountPrivateKeyProviderNone) {
						const key = await new Key("", "", "")
							.decrypt(e);
						if (! IsErr(key)) {
							const k = ParseKey(key);
							if (! IsErr(k)) {
								this.privateKey(k);
							}
						}

						break;
					}

					const aesKey = await NewPBDKF2AES128Key(password, e.keyID);

					if (! IsErr(aesKey)) {
						const k = new Key(KeyTypeAES128, aesKey, RandString(10));
						const key = await k.decrypt(e);

						if (!IsErr(key) && key !== "") {
							if (key.includes("rsa2048")) {
								const pk = ParseKey(key);

								if (!IsErr(pk)) {
									this.privateKey(pk);
								}
							} else { // backwards compatibility
								this.privateKey(new Key(KeyTypeRSA2048Private, key, ""));
							}

							break;
						}
					}
				}
			}
		}

		if (remember === true) {
			await this.savePrivateKey();
		}

		m.redraw();
	}

	async deleteICalendarID (): Promise<void> {
		return API.delete("/api/v1/icalendar")
			.then(() => {});
	}

	async deletePrivateKey (name: string): Promise<void | Err> {
		return this.updatePrivatePublicKeys({
			...this.data(),
			...{
				privateKeys: this.data().privateKeys.filter((key) => {
					return key.name !== name;
				}),
			},
		});
	}

	async deleteSessions (): Promise<void> {
		return API.delete(`${this.path}/${this.data().id}/sessions`)
			.then(() => {});
	}

	isDemo (): boolean {
		return AuthAccountState.data().emailAddress.includes("demo.example.com");
	}

	findNotificationsHousehold (notifications: AuthAccountPreferencesNotificationsHouseholds[] | null, id: NullUUID):AuthAccountPreferencesNotificationsHouseholds {
		if (notifications !== null) {
			const i = notifications.findIndex((ah) => {
				return ah.authHouseholdID === id;
			});

			if (i >= 0) {
				return notifications[i];
			}
		}

		return {
			...this.newNotificationsHouseholds(),
			...{
				authHouseholdID: id,
			},
		};
	}

	async hideCalendarHealthLogs (id: NullUUID): Promise<void | Err> {
		const a = this.data();

		a.preferences.hideCalendarHealthLogs = PushPopStringArray(id, a.preferences.hideCalendarHealthLogs);

		return this.update(a, true);
	}

	async loadPrivateKey (): Promise<void> {
		return IndexedDB.get("AuthAccountPrivateKey")
			.then((key) => {
				if (typeof key === "string") {
					const k = ParseKey(key);
					if (! IsErr(k)) {
						this.privateKey(k);
					}
				}
			});
	}

	override new (): AuthAccount {
		return {
			child: false,
			collapsedNotesPages: [],
			collapsedPlanProjects: [],
			collapsedPlanTasks: [],
			created: null,
			dailyAgendaNext: null,
			dailyAgendaTime: "00:00",
			emailAddress: "",
			hideCalendarICalendars: [],
			icalendarID: null,
			id: null,
			iso639Code: navigator.language.split("-")[0],
			lastActivity: null,
			name: "",
			oidcCode: "",
			oidcProviderType: OIDCProviderTypeEnum.None,
			password: "",
			passwordResetToken: null,
			permissionsAccount: Permission.new(),
			permissionsHouseholds: [],
			preferences: {
				colorAccent: ColorEnum.Default,
				colorNegative: ColorEnum.Default,
				colorPositive: ColorEnum.Default,
				colorPrimary: ColorEnum.Default,
				colorSecondary: ColorEnum.Default,
				darkMode: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
				formatDateOrder: CivilDateOrderEnum.MDY,
				formatDateSeparator: CivilDateSeparatorEnum.ForwardSlash,
				formatTime24: false,
				formatWeek8601: false,
				hideCalendarBudgetRecurrences: false,
				hideCalendarCookMealPlans: false,
				hideCalendarEvents: false,
				hideCalendarHealthLogs: [],
				hideCalendarPlanTasks: false,
				hideComponents: [],
				ignoreDeviceAgenda: false,
				ignoreDeviceCalendarEvent: false,
				ignoreDevicePlanTask: false,
				ignoreEmailAgenda: false,
				ignoreEmailCalendarEvent: false,
				ignoreEmailNewsletter: false,
				ignoreEmailPlanTask: false,
				notificationsHouseholds: [],
				showCalendarEventAstronomy: false,
				showCalendarEventHolidaysCA: false,
				showCalendarEventHolidaysUK: false,
				showCalendarEventHolidaysUS: false,
			},
			primaryAuthHouseholdID: null,
			privateKeys: [],
			publicKey: "",
			rememberMe: true,
			selfHostedID: null,
			setup: false,
			subscriptionReferrerCode: "",
			timeZone: Intl.DateTimeFormat()
				.resolvedOptions().timeZone,
			tosAccepted: false,
			totpBackup: "",
			totpCode: "",
			totpEnabled: false,
			totpQR: "",
			totpSecret: "",
			updated: null,
			userAgent: getUserAgent(),
			verified: false,
		};
	}

	async newPrivatePublicKey (name: string, password: string): Promise<void> {
		const keys = await NewKey(KeyTypeRSA2048Private);
		if (IsErr(keys)) {
			this.alertWebCrypto(keys);

			return;
		}

		const key = await this.newPrivateKeyPBKDF2(password, (keys.privateKey as Key).string());

		if (IsErr(key)) {
			AppState.setLayoutAppAlert(key);

			return;
		}

		if (key !== undefined) {
			return AuthAccountState.updatePrivatePublicKeys({
				...AuthAccountState.data(),
				...{
					privateKeys: [
						{
							key: key,
							name: name,
							provider: AuthAccountPrivateKeyProviderPasswordPBKDF2,
						},
					],
					publicKey: (keys.publicKey as Key).string(),
				},
			})
				.then(() => {
					AuthAccountState.privateKey(keys.privateKey as Key);
				});
		}
	}

	async newPrivateKeyPBKDF2 (password: string, privateKey?: string): Promise<string | undefined> {
		const salt = ArrayBufferToBase64(crypto.getRandomValues(new Uint8Array(12)));

		if (crypto.subtle === undefined) {
			this.alertWebCrypto();

			return;
		}

		const key = await NewPBDKF2AES128Key(password, salt);
		if (IsErr(key)) {
			AppState.setLayoutAppAlert(key);

			return "";
		}

		const k = new Key(KeyTypeAES128, key, salt);

		const ev = await k.encrypt(privateKey === undefined ?
			this.privateKey()
				.string() :
			privateKey);

		if (IsErr(ev)) {
			AppState.setLayoutAppAlert(ev);

			return "";
		}

		if (ev === undefined) {
			return;
		}

		return ev.string();
	}

	newNotificationsHouseholds (): AuthAccountPreferencesNotificationsHouseholds {
		return {
			authHouseholdID: null,
			ignoreDeviceCalendarEvent: false,
			ignoreDeviceCookMealPlanCook: false,
			ignoreDeviceCookMealPlanPrep: false,
			ignoreDevicePlanTask: false,
			ignoreDevicePlanTaskComplete: false,
			ignoreEmailCalendarEvent: false,
			ignoreEmailCookMealPlanCook: false,
			ignoreEmailCookMealPlanPrep: false,
			ignoreEmailPlanTask: false,
		};
	}

	async readAll (filter?: string, offset?: number): Promise<APIResponse<AuthAccount[]> | Err> {
		return API.read(this.path, {
			filter: filter,
			offset: offset,
		})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (response.dataValue !== null) {
					return response as APIResponse<AuthAccount[]>; // eslint-disable-line @typescript-eslint/consistent-type-assertions
				}

				return ErrUnknownResponse;
			});
	}

	async readTOTPBackup (): Promise<string | Err> {
		return API.read(`${this.path}/${this.data().id}/totp`, {})
			.then((response) => {
				if (IsErr(response)) {
					return response;
				}

				if (this.inResponse(response)) {
					return response.dataValue[0].totpBackup;
				}

				return "";
			});
	}

	async readVerify (): Promise<void> {
		return API.read("/api/v1/auth/verify", {})
			.then(() => {
				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(WebAuthAccountVerificationSent),
				});
			});
	}

	async savePrivateKey (): Promise<void | Err> {
		return IndexedDB.set("AuthAccountPrivateKey", this.privateKey()
			.string());
	}

	override async set (data?: AuthAccount, save?: boolean): Promise<void | Err> {
		if (data !== undefined) {
			return super.set(
				{
					...this.new(),
					...data,
					...{
						preferences: {
							...this.new().preferences,
							...data.preferences,
						},
					},
				},
				save,
			);
		}
	}

	async setPrivateKey (a: AuthAccountPrivateKey): Promise<void | Err> {
		const keys = this.data().privateKeys;

		const i = keys.findIndex((key) => {
			return key.name === a.name;
		});

		if (i < 0) {
			keys.push(a);
		} else {
			keys[i] = a;
		}

		return this.updatePrivatePublicKeys({
			...this.data(),
			...{
				privateKeys: keys,
			},
		});
	}

	translate (t: Translation): string {
		return Translate(this.data().iso639Code, t);
	}

	async updateICalendarID (): Promise<void | Err> {
		return API.update("/api/v1/icalendar")
			.then(async (response) => {
				if (IsErr(response)) {
					return response;
				}

				if (this.inResponse(response)) {
					this.alertAction(ActionsEnum.Update);

					return this.set(response.dataValue[0]);
				}
			});
	}

	async updateHideComponents (component: string): Promise<void | Err> {
		const newComponents: string[] = Clone(this.data().preferences.hideComponents);
		const name = component.toLowerCase();
		const index = newComponents.indexOf(name);

		if (index >= 0) {
			newComponents.splice(index, 1);
		} else {
			newComponents.push(name);
		}

		return this.update({
			...this.data(),
			...{
				preferences: {
					...this.data().preferences,
					...{
						hideComponents: newComponents,
					},
				},
			},
		});
	}

	async updatePrivatePublicKeys (data: AuthAccount): Promise<void | Err> {
		return API.update(`/api/v1/auth/accounts/${data.id}/keys`, data)
			.then(async (response) => {
				if (IsErr(response)) {
					return response;
				}

				if (this.inResponse(response)) {
					this.alertAction(ActionsEnum.Update);

					return this.set(response.dataValue[0]);
				}
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	}

	async updateReset (data: AuthAccount): Promise<void> {
		return API.update("/api/v1/auth/reset", data)
			.then(() => {
				this.alertAction(ActionsEnum.Update);
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	}

	async updateTOTP (data: AuthAccount): Promise<void | Err> {
		return API.update(`/api/v1/auth/accounts/${data.id}/totp`, data)
			.then(async (response) => {
				if (IsErr(response)) {
					return response;
				}

				if (this.inResponse(response)) {
					this.alertAction(ActionsEnum.Update);

					return this.set(response.dataValue[0]);
				}
			})
			.catch((response) => {
				AppState.setLayoutAppAlert({
					message: response.message,
				});
			});
	}

	async updateVerify (id: string, token: string): Promise<void | Err> {
		return API.update(`/api/v1/auth/verify?id=${id}&token=${token}`, {})
			.then((response) => {
				m.route.set("/home");

				if (IsErr(response)) {
					return response;
				}

				if (response.status !== 200) {
					return NewErr("AuthAccount.updateVerify: wrong status", "Error verifying your account, try again later");
				}

				AppState.setLayoutAppAlert({
					message: AuthAccountState.translate(ObjectAccountVerified),
				});

				return;
			});
	}
}

export const AuthAccountState = new AuthAccountManager();
