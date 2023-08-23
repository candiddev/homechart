import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { NotesPageState } from "../states/NotesPage";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { NotesPagesID } from "./NotesPagesID";

beforeEach(() => {
	NotesPageState.data([
		...seed.notesPages,
		...[
			{
				...NotesPageState.new(),
				...{
					authAccountID: seed.authAccounts[0].id,
					deleted: Timestamp.now()
						.toString(),
					id: "1",
					name: "Deleted",
					shortID: "4",
					tags: [
						"a",
						"b",
					],
				},
			},
		],
	]);
	NotesPageVersionState.loading = 1;
	NotesPageVersionState.data([
		...seed.notesPageVersions,
		...[
			{
				...NotesPageVersionState.new(),
				...{
					id: "1",
					notesPageID: "1",
					updated: Timestamp.now()
						.toString(),
				},
			},
		],
	]);

	NotesPageVersionState.data()[6].body = `${NotesPageVersionState.data()[6].body}

# Show me some code

\`\`\`
# Here is my code
\`\`\`
`;
});

afterEach(() => {
	testing.mocks.params = {};
});

describe("NotesPagesID", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);

	test.each([
		[
			"personal",
			{
				id: seed.notesPages[4].id,
				tag: "personal",
			},
			seed.notesPages[4].name,
			"Using Notes- Getting Started Show me some code",
			seed.notesPages[4].tags,
			seed.notesPageVersions[4].updated,
		],
		[
			"household",
			{
				id: seed.notesPages[2].id,
				tag: "household",
			},
			seed.notesPages[2].name,
			"",
			seed.notesPages[2].tags,
			seed.notesPageVersions[0].updated,
		],
	])("page.%s", async (_name, params, title, toc, tags, updated) => {
		testing.mocks.params = params;
		testing.mount(App, routeOptions, NotesPagesID);
		expect(document.title)
			.toContain(title);
		if (toc !== "") {
			testing.text("#toc", `On this page: ${toc}`);
		}
		testing.text(".ButtonArray", `tag${tags.join("tag")}`);
		testing.text("#updated", `Last Updated: ${AppState.formatCivilDate(Timestamp.fromString(updated)
			.toCivilDate()
			.toJSON())}`);
	});

	test.each([
		[
			"none",
			{
				id: seed.notesPages[0].id,
				tag: "personal",
			},
			"deleteDeleteJournaleditEdit",
		],
		[
			"edit",
			{
				edit: "",
				id: seed.notesPages[0].id,
				tag: "personal",
			},
			"cancelCancelJournalsaveSave",
		],
		[
			"version",
			{
				id: seed.notesPages[0].id,
				tag: "personal",
				version: seed.notesPageVersions[0].id,
			},
			"deleteDeleteJournalrestore_from_trashRestore",
		],
		[
			"deleted",
			{
				id: "1",
				tag: "personal",
			},
			"delete_foreverDelete ForeverDeletedrestore_from_trashRestore",
		],
	])("header.%s", async (_name, params, headerContents) => {
		testing.mocks.params = params;
		testing.mount(App, routeOptions, NotesPagesID);
		testing.text(".Title", headerContents);
	});

	test("edit", async () => {
		testing.mocks.params = {
			edit: "",
			id: seed.notesPages[1].id,
			tag: "personal",
		};
		testing.mount(App, routeOptions, NotesPagesID);
		testing.value("#form-item-input-name", seed.notesPages[1].name);
		testing.hasClass(`#form-item-option-parent-page-${seed.notesPages[0].id}`, "FormItemSelectNested__option--selected");
		testing.find("#form-item-input-icon");
		testing.find("#form-item-select-color");
		testing.find("#form-item-input-tags");
		testing.value("#form-item-text-area-body", seed.notesPageVersions[2].body);
	});
});
