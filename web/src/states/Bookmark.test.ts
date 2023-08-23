import { Icons } from "@lib/types/Icons";

import seed from "../jest/seed";
import type { Bookmark } from "./Bookmark";
import { BookmarkState } from "./Bookmark";

describe("Bookmark", () => {
	test("data", () => {
		BookmarkState.data(seed.bookmarks);
	});

	test.each([
		[
			"iconName",
			{
				...BookmarkState.new(),
				...{
					iconName: "test",
				},
			},
			"test",
		],
		[
			"iconLink",
			{
				...BookmarkState.new(),
				...{
					iconLink: "https://example.com",
				},
			},
			"https://example.com",
		],
		[
			"none",
			BookmarkState.new(),
			Icons.Bookmark,
		],
	])("getIcon.%s", (_name: string, bookmark: Bookmark, output: string) => {
		expect(BookmarkState.getIcon(bookmark))
			.toBe(output);
	});

	test.each([
		[
			"local",
			{
				...BookmarkState.new(),
				...{
					link: "/cook/recipes",
				},
			},
			"/cook/recipes",
		],
		[
			"newWindow",
			{
				...BookmarkState.new(),
				...{
					link: "https://example.com",
					newWindow: true,
				},
			},
			"https://example.com",
		],
		[
			"iframe",
			{
				...BookmarkState.new(),
				...{
					id: "1",
					link: "https://example.com",
				},
			},
			"/bookmarks/1",
		],
	])("getLink.%s", (_name: string, bookmark: Bookmark, output: string) => {
		expect(BookmarkState.getLink(bookmark))
			.toBe(output);
	});
});
