import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BookmarkState } from "../states/Bookmark";
import { FormOverlayBookmark } from "./FormOverlayBookmark";

test("FormOverlayBookmark", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BookmarkState.create = vi.fn();
	BookmarkState.delete = vi.fn();
	BookmarkState.update = vi.fn();

	const bookmark = {
		...BookmarkState.new(),
		...{
			id: UUID.new(),
		},
	};

	testing.mount(FormOverlayBookmark, {
		data: bookmark,
	});

	// Init
	testing.notFind("#form-item-input-url-of-icon-image");
	bookmark.iconLink = "hello";
	testing.mount(FormOverlayBookmark, {
		data: bookmark,
	});
	testing.find("#form-item-input-url-of-icon-image");
	bookmark.iconLink = "";
	testing.mount(FormOverlayBookmark, {
		data: bookmark,
	});

	// Buttons
	testing.find("#form-update-bookmark");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(BookmarkState.delete)
		.toBeCalledWith(bookmark.id);
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(BookmarkState.update)
		.toBeCalled();
	bookmark.id = null;
	testing.redraw();
	testing.click("#button-add");
	expect(BookmarkState.create)
		.toBeCalled();

	// Owner
	testing.find("#form-item-owner");

	// Name
	const name = testing.find("#form-item-input-name");
	testing.input(name, "Test2");
	expect(bookmark.name)
		.toBe("Test2");
	testing.value(name, "Test2");

	// Link
	const link = testing.find("#form-item-input-link");
	testing.input(link, "link");
	expect(bookmark.link)
		.toBe("link");
	testing.value(link, "link");

	// new window
	testing.click("#form-checkbox-input-open-in-new-window");
	expect(bookmark.newWindow)
		.toBeTruthy();

	// show on home
	testing.click("#form-checkbox-input-show-on-home");
	expect(bookmark.home)
		.toBeTruthy();

	// Link Icon
	const iconName = testing.find("#form-item-input-icon");
	testing.input(iconName, "icon");
	expect(bookmark.iconName)
		.toBe("icon");
	testing.value(iconName, "icon");

	// Icon URL
	testing.notFind("#form-item-input-url-of-icon-image");
	testing.click("#form-checkbox-input-use-image-as-icon");
	const iconURL = testing.find("#form-item-input-url-of-icon-image");
	testing.input(iconURL, "icon");
	expect(bookmark.iconLink)
		.toBe("icon");
	testing.value(iconURL, "icon");

	// Tags
	const tags = testing.find("#form-item-input-tags");
	testing.input(tags, "a ");
	expect(bookmark.tags)
		.toStrictEqual([
			"a",
		]);

});
