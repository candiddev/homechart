import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BookmarkState } from "../states/Bookmark";
import { Bookmarks } from "./Bookmarks";

describe("Bookmarks", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	BookmarkState.data(seed.bookmarks);
	BookmarkState.refreshed = true;

	test("all", async () => {
		testing.mount(App, routeOptions, Bookmarks);
		testing.title("Bookmarks");
		testing.findAll("tbody tr", seed.bookmarks.length);
		const td = testing.findAll(".TableData");
		testing.text(td[0], `${BookmarkState.data()[6].name}`);
		testing.text(td[1], BookmarkState.data()[6].link);
		testing.notFind("#form-item-input-name");
		testing.click(`#table-row_${BookmarkState.data()[6].id}`);
		testing.value("#form-item-input-name", BookmarkState.data()[6].name);
		testing.click("#button-cancel");
		await testing.sleep(100);
		testing.notFind("#form-item-input-name");
	});

	test("personal", async () => {
		testing.mocks.params.filter = "personal";
		testing.mount(Bookmarks, {});
		testing.title("Bookmarks");
		testing.findAll("tbody tr", 2);
	});

	test("household", async () => {
		testing.mocks.params.filter = "household";
		testing.mount(Bookmarks, {});
		testing.title("Bookmarks");
		testing.title("Bookmarks");
		testing.findAll("tbody tr", 6);
	});

	test("tag", async () => {
		testing.mocks.params = {};
		testing.mount(Bookmarks, {});
		const tags = testing.find("#button-array-show-tag");
		testing.text(tags, "tagtilestagdocumentstagimportanttagwarrantiestagreceipts");
		testing.click(`#${tags.id} p`);
		testing.findAll("tbody tr", 3);
	});
});
