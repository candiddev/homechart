import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { NotesPageState } from "../states/NotesPage";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { NotesPages } from "./NotesPages";

beforeEach(() => {
  NotesPageState.data([
    ...seed.notesPages,
    ...[
      {
        ...NotesPageState.new(),
        ...{
          authAccountID: seed.authAccounts[0].id,
          deleted: Timestamp.now().toString(),
          id: "1",
          name: "Deleted",
          tags: ["a", "b"],
        },
      },
    ],
  ]);
  NotesPageVersionState.loading = 1;
  NotesPageVersionState.set([
    ...seed.notesPageVersions,
    ...[
      {
        ...NotesPageVersionState.new(),
        ...{
          id: "1",
          notesPageID: "1",
          updated: Timestamp.now().toString(),
        },
      },
    ],
  ]);
  testing.mocks.params = {};
});

describe("NotesPages", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);

  test.each([
    [
      "personal",
      {
        tag: "personal",
      },
      3,
      `${seed.notesPages[1].name}tag${seed.notesPages[1].tags.join("tag")}`,
      seed.notesPages[0].name,
      AppState.formatCivilDate(
        Timestamp.fromString(seed.notesPageVersions[2].updated)
          .toCivilDate()
          .toJSON(),
      ),
    ],
    [
      "household",
      {
        tag: "household",
      },
      2,
      `${seed.notesPages[3].name}tag${seed.notesPages[3].tags.join("tag")}`,
      seed.notesPages[2].name,
      AppState.formatCivilDate(
        Timestamp.fromString(seed.notesPageVersions[5].updated)
          .toCivilDate()
          .toJSON(),
      ),
    ],
    [
      "tag",
      {
        tag: "informative",
      },
      1,
      `${seed.notesPages[2].name}tag${seed.notesPages[2].tags.join("tag")}`,
      "",
      AppState.formatCivilDate(
        Timestamp.fromString(seed.notesPageVersions[4].updated)
          .toCivilDate()
          .toJSON(),
      ),
    ],
    [
      "deleted",
      {
        deleted: "",
        tag: "personal",
      },
      1,
      "Deletedtagatagb",
      "",
      AppState.formatCivilDate(Timestamp.now().toCivilDate().toJSON()),
    ],
  ])(
    "routes.%s",
    async (_name, params, rows, row0name, row0parent, row0updated) => {
      testing.mocks.params = params;
      testing.mount(NotesPages);
      const r = testing.findAll("tbody tr", rows);
      /* eslint-disable no-restricted-syntax */
      testing.text(r[0].getElementsByTagName("TD")[0], row0name);
      testing.text(r[0].getElementsByTagName("TD")[1], row0parent);
      testing.text(r[0].getElementsByTagName("TD")[2], row0updated);
    },
  );

  test("search", async () => {
    testing.mocks.params.tag = "personal";
    testing.mount(NotesPages);
    testing.findAll("tbody tr", 3);
    testing.input("#form-item-input-table", "Jour");
    await testing.sleep(1200);
    testing.findAll("tbody tr", 1);
    testing.input("#form-item-input-table", "asdf");
    await testing.sleep(1200);
    testing.findAll("tbody tr", 0);
    testing.input("#form-item-input-table", "Cooked");
    await testing.sleep(1200);
    testing.text(
      `#table-data-${seed.notesPages[1].id}-name`,
      `${seed.notesPages[1].name}tag${seed.notesPages[1].tags.join("tag")}`,
    );
  });
});
