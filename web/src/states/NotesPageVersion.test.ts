import seed from "../jest/seed";
import { NotesPageVersionState } from "./NotesPageVersion";

beforeAll(() => {
  NotesPageVersionState.loading = 1;
  NotesPageVersionState.set(seed.notesPageVersions);
});

describe("NotesPageVersion", () => {
  test("findNotesPageIDAll", () => {
    expect(
      NotesPageVersionState.findNotesPageIDAll(seed.notesPages[0].id),
    ).toStrictEqual([seed.notesPageVersions[1], seed.notesPageVersions[0]]);
  });

  test("findNotesPageIDLatest", () => {
    expect(
      NotesPageVersionState.findNotesPageIDLatest(seed.notesPages[0].id),
    ).toStrictEqual(seed.notesPageVersions[1]);
  });
});
