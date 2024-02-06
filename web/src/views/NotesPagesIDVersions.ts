import { Table } from "@lib/components/Table";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Timestamp } from "@lib/types/Timestamp";
import { FormCreated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { NotesPageState } from "../states/NotesPage";
import type { NotesPageVersion } from "../states/NotesPageVersion";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectHousehold,
  ObjectNotes,
  ObjectVersions,
  WebGlobalCreator,
  WebGlobalPersonal,
} from "../yaml8n";

export function NotesPagesIDVersions(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      updated: "", // eslint-disable-line sort-keys
      createdBy: "", // eslint-disable-line sort-keys
    }),
    id: Stream(null as NullUUID),
    sort: Stream({
      invert: true,
      property: "updated",
    }),
  };

  let data: Stream<NotesPageVersion[]>;

  return {
    oninit: async (): Promise<void> => {
      data = Stream.lift(
        (_page, _pageVersions, columns, id, sort) => {
          const notesPage = NotesPageState.findID(id);

          AppState.setLayoutApp({
            ...GetHelp("notes"),
            breadcrumbs: [
              {
                link: "/notes/all",
                name: AuthAccountState.translate(ObjectNotes),
              },
              {
                link: `/notes/${
                  m.route.param().tag === "personal" ? "personal" : "household"
                }`,
                name: `${
                  m.route.param().tag === "personal"
                    ? AuthAccountState.translate(WebGlobalPersonal)
                    : AuthAccountState.translate(ObjectHousehold)
                }`,
              },
              {
                link: `/notes/${
                  m.route.param().tag === "personal" ? "personal" : "household"
                }/${notesPage.id}`,
                name: notesPage.name,
              },
              {
                name: AuthAccountState.translate(ObjectVersions),
              },
            ],
            toolbarActionButtons: [],
          });

          return Filter.array(
            NotesPageVersionState.findNotesPageIDAll(id),
            columns,
            sort,
          );
        },
        NotesPageState.data,
        NotesPageVersionState.data,
        state.columns,
        state.id,
        state.sort,
      );

      state.id(m.route.param().id);
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: data(),
        editOnclick: (version: NotesPageVersion) => {
          m.route.set(
            `/notes/${m.route.param().tag}/${m.route.param().id}?version=${version.id}`,
          );
        },
        filters: [],
        loaded: NotesPageVersionState.isLoaded(),
        sort: state.sort,
        staticColumns: true,
        tableColumns: [
          {
            formatter: (version: NotesPageVersion): string => {
              return Timestamp.fromString(version.updated!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                .toPrettyString(
                  AuthAccountState.data().preferences.formatDateOrder,
                  AuthAccountState.data().preferences.formatDateSeparator,
                  AuthAccountState.data().preferences.formatTime24,
                );
            },
            name: AuthAccountState.translate(FormCreated),
            property: "updated",
          },
          {
            formatter: (version: NotesPageVersion): string => {
              const member = AuthHouseholdState.findMember(version.createdBy);

              if (member.name === "") {
                return member.emailAddress;
              }

              return member.name;
            },
            name: AuthAccountState.translate(WebGlobalCreator),
            property: "createdBy",
          },
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
