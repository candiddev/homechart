import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Icons } from "@lib/types/Icons";

import { DataTypeEnum } from "../types/DataType";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectBookmarkCreated, ObjectBookmarkDeleted, ObjectBookmarkUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface Bookmark {
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	created: NullTimestamp,
	home: boolean,
	iconLink: string,
	iconName: string,
	id: NullUUID,
	link: string,
	name: string,
	newWindow: boolean,
	shortID: string,
	tags: string[],
	updated: NullTimestamp,
	updatedBy: NullUUID,
}

class BookmarkManager extends DataArrayManager<Bookmark> {
	constructor () {
		super("/api/v1/bookmarks", "name", false, DataTypeEnum.Bookmark);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectBookmarkCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectBookmarkDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectBookmarkUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	getIcon (b: Bookmark): string {
		if (b.iconName !== "") {
			return b.iconName;
		} else if (b.iconLink !==  "") {
			return b.iconLink;
		}

		return Icons.Bookmark;
	}

	getLink (b: Bookmark): string {
		return b.link.startsWith("/") || b.newWindow ?
			b.link :
			`/bookmarks/${b.id}`;
	}

	override new (): Bookmark {
		const p = Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Auth, PermissionEnum.Edit, AuthAccountState.data().primaryAuthHouseholdID);

		return {
			authAccountID:
				p ?
					null :
					AuthAccountState.data().id,
			authHouseholdID:
				p ?
					AuthAccountState.data().primaryAuthHouseholdID :
					null,
			created: null,
			home: false,
			iconLink: "",
			iconName: "",
			id: null,
			link: "",
			name: "",
			newWindow: false,
			shortID: "",
			tags: [],
			updated: null,
			updatedBy: null,
		};
	}
}

export const BookmarkState = new BookmarkManager();
