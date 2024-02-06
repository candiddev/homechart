import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { NotesPageState } from "../states/NotesPage";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { NotesPagesIDVersions } from "./NotesPagesIDVersions";

test("NotesPagesIDVersions", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  NotesPageState.data(seed.notesPages);
  NotesPageVersionState.loading = 1;
  NotesPageVersionState.set(seed.notesPageVersions);

  testing.mocks.params = {
    id: seed.notesPages[2].id,
    tag: "household",
  };

  testing.mount(NotesPagesIDVersions);

  testing.findAll("tbody tr", 2);
  testing.text(
    `#table-data-${seed.notesPageVersions[4].id}-updated`,
    Timestamp.fromString(seed.notesPageVersions[4].updated).toPrettyString(
      AuthAccountState.data().preferences.formatDateOrder,
      AuthAccountState.data().preferences.formatDateSeparator,
      AuthAccountState.data().preferences.formatTime24,
    ),
  );
  testing.text(
    `#table-data-${seed.notesPageVersions[4].id}-createdby`,
    seed.authAccounts[1].name,
  );
  testing.text(
    `#table-data-${seed.notesPageVersions[3].id}-updated`,
    Timestamp.fromString(seed.notesPageVersions[3].updated).toPrettyString(
      AuthAccountState.data().preferences.formatDateOrder,
      AuthAccountState.data().preferences.formatDateSeparator,
      AuthAccountState.data().preferences.formatTime24,
    ),
  );
  testing.text(
    `#table-data-${seed.notesPageVersions[3].id}-createdby`,
    seed.authAccounts[0].name,
  );
});
