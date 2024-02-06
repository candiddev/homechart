import "./NotesPagesID.css";

import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInput } from "@lib/components/FormItemInput";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import { FormItemSelectNested } from "@lib/components/FormItemSelectNested";
import { FormLoading } from "@lib/components/FormLoading";
import { Markdown } from "@lib/components/Markdown";
import { Title } from "@lib/components/Title";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { StringToID } from "@lib/utilities/StringToID";
import { ActionCancel, ActionNew, FormLastUpdated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { NotesPage } from "../states/NotesPage";
import { NotesPageState } from "../states/NotesPage";
import type { NotesPageVersion } from "../states/NotesPageVersion";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectNotes,
  ObjectPage,
  ObjectParentPage,
  WebAdminNotificationsBody,
  WebGlobalActionSave,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalTags,
  WebGlobalTagsTooltip,
  WebNotesPagesIDParentPageTooltip,
} from "../yaml8n";

export function NotesPagesID(): m.Component {
  const state: {
    edit: Stream<boolean>;
    id: Stream<NullUUID>;
    notesPage: NotesPage;
    notesPageVersion: NotesPageVersion;
    parentID: Stream<string>;
    lift: Stream<void>;
    version: Stream<NullUUID>;
  } = {
    edit: Stream(false as boolean),
    id: Stream(null as NullUUID),
    lift: Stream(),
    notesPage: NotesPageState.new(),
    notesPageVersion: NotesPageVersionState.new(),
    parentID: Stream(""),
    version: Stream(null as NullUUID),
  };

  return {
    oninit: async (): Promise<void> => {
      state.lift = Stream.lift(
        (_notesPage, _notesPageVersion, edit, id, parentID, version) => {
          if (!edit || state.notesPage.id === null) {
            if (parentID !== "") {
              const parent = NotesPageState.findID(m.route.param().parentID);
              state.notesPage.authAccountID = parent.authAccountID;
              state.notesPage.authHouseholdID = parent.authHouseholdID;
              state.notesPage.parentID = parent.id;
            } else if (id !== null) {
              state.notesPage = NotesPageState.findID(id);
            }
          }

          if (!edit || state.notesPageVersion.id === null) {
            const page = NotesPageVersionState.findNotesPageIDLatest(
              state.notesPage.id,
            );

            if (version !== null) {
              state.notesPageVersion = NotesPageVersionState.findID(version);
            } else if (state.notesPageVersion.updated !== page.updated) {
              state.notesPageVersion = page;
            }
          }

          const title = [
            {
              link: "/notes",
              name: AuthAccountState.translate(ObjectNotes),
            },
            ...(NotesPageState.isLoaded()
              ? [
                  {
                    name:
                      state.notesPage.name === ""
                        ? AuthAccountState.translate(ActionNew)
                        : state.notesPage.name,
                  },
                ]
              : []),
          ];

          if (state.notesPage.name === "") {
            if (
              m.route.param().tag === "personal" ||
              AuthAccountState.data().primaryAuthHouseholdID === null
            ) {
              state.notesPage.authAccountID = AuthAccountState.data().id;
            } else {
              state.notesPage.authHouseholdID =
                AuthAccountState.data().primaryAuthHouseholdID;
            }
          }

          AppState.setLayoutApp({
            ...GetHelp("notes"),
            breadcrumbs: title,
            toolbarActionButtons: [
              {
                icon: Icons.Notes,
                name: AuthAccountState.translate(ObjectPage),
                onclick: (): void => {
                  state.edit(false);
                  m.route.set(
                    `/notes/${
                      state.notesPage.authAccountID === null
                        ? "household"
                        : "personal"
                    }/new`,
                    {
                      edit: "",
                      parentID: state.notesPage.id,
                    },
                    {
                      state: {
                        key: Date.now(),
                      },
                    },
                  );
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Notes,
                  true,
                  state.notesPage.authHouseholdID,
                ),
                requireOnline: true,
              },
            ],
          });

          m.redraw();
        },
        NotesPageState.data,
        NotesPageVersionState.data,
        state.edit,
        state.id,
        state.parentID,
        state.version,
      );

      if (m.route.param().version === undefined) {
        state.version(null);
      } else {
        state.version(m.route.param().version);
      }

      if (m.route.param().id === undefined) {
        state.id(null);
      } else {
        state.id(m.route.param().id);
      }

      if (m.route.param().parentID !== undefined) {
        state.parentID(m.route.param().parentID);
      }

      if (m.route.param().tag === "personal") {
        state.notesPage.authAccountID = AuthAccountState.data().id;
      } else {
        state.notesPage.authHouseholdID =
          AuthAccountState.data().primaryAuthHouseholdID;
      }

      if (m.route.param().edit !== undefined) {
        state.edit(true);
      }
    },
    onremove: (): void => {
      state.lift.end(true);
    },
    view: (): m.Children => {
      const loaded =
        NotesPageState.isLoaded() && NotesPageVersionState.isLoaded();

      return state.edit()
        ? m(
            Form,
            {
              forceWide: true,
              loaded: loaded,
              onsubmit: async (): Promise<void | Err> => {
                if (m.route.param().id === "new") {
                  let id = null as NullUUID;

                  return NotesPageState.create(state.notesPage)
                    .then(async (page) => {
                      if (IsErr(page)) {
                        return page;
                      }

                      id = page.id;
                      state.notesPageVersion.notesPageID = page.id;
                      state.notesPageVersion.updated = null;

                      return NotesPageVersionState.create(
                        state.notesPageVersion,
                        true,
                      );
                    })
                    .then(() => {
                      m.route.set(
                        `/notes/${
                          state.notesPage.authHouseholdID === null
                            ? "personal"
                            : "household"
                        }/${id}`,
                        undefined,
                        {
                          state: {
                            key: Date.now(),
                          },
                        },
                      );

                      m.redraw();
                    });
                }

                await NotesPageState.update(state.notesPage);

                if (
                  state.notesPageVersion.body !==
                  NotesPageVersionState.findID(state.notesPageVersion.id).body
                ) {
                  state.notesPageVersion.updated = null;
                  await NotesPageVersionState.create(state.notesPageVersion);
                }

                m.route.set(
                  `/notes/${
                    state.notesPage.authHouseholdID === null
                      ? "personal"
                      : "household"
                  }/${state.notesPage.id}`,
                  undefined,
                  {
                    state: {
                      key: Date.now(),
                    },
                  },
                );
              },
              title: {
                buttonLeft: {
                  icon: Icons.Cancel,
                  name: AuthAccountState.translate(ActionCancel),
                  onclick: async (): Promise<void> => {
                    m.route.set(
                      `/notes/${m.route.param().tag}${
                        state.notesPage.id === null
                          ? ""
                          : `/${state.notesPage.id}`
                      }`,
                      {},
                      {
                        state: {
                          key: Date.now(),
                        },
                      },
                    );
                  },
                  permitted: GlobalState.permitted(
                    PermissionComponentsEnum.Notes,
                    true,
                    state.notesPage.authHouseholdID,
                  ),
                  requireOnline: true,
                },
                buttonRight: {
                  icon: Icons.Save,
                  name: AuthAccountState.translate(WebGlobalActionSave),
                  permitted: GlobalState.permitted(
                    PermissionComponentsEnum.Notes,
                    true,
                    state.notesPage.authHouseholdID,
                  ),
                  primary: true,
                  requireOnline: true,
                  submit: true,
                },
                name:
                  state.notesPage.name === ""
                    ? `${AuthAccountState.translate(ActionNew)} ${AuthAccountState.translate(ObjectPage)}`
                    : state.notesPage.name,
              },
              wrap: true,
            },
            [
              m(FormItem, {
                input: {
                  oninput: (e: string): void => {
                    state.notesPage.name = e;
                  },
                  required: true,
                  type: "text",
                  value: state.notesPage.name,
                },
                name: AuthAccountState.translate(WebGlobalName),
                tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
              }),
              m(FormItemSelectColor, {
                oninput: (e) => {
                  state.notesPage.color = e;
                },
                value: state.notesPage.color,
              }),
              m(FormItemInputIcon, {
                oninput: (e) => {
                  state.notesPage.icon = e;
                },
                value: state.notesPage.icon,
              }),
              m(FormItem, {
                input: {
                  datalist: NotesPageState.tagNames(),
                  icon: Icons.Tag,
                  type: "text",
                  value: state.notesPage.tags,
                },
                name: AuthAccountState.translate(WebGlobalTags),
                tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
              }),
              m(FormItemSelectNested, {
                name: AuthAccountState.translate(ObjectParentPage),
                onselect: (e: string): void => {
                  switch (e) {
                    case "personal":
                      state.notesPage.authAccountID =
                        AuthAccountState.data().id;
                      state.notesPage.authHouseholdID = null;
                      state.notesPage.parentID = null;
                      break;
                    case "household":
                      state.notesPage.authAccountID = null;
                      state.notesPage.authHouseholdID =
                        AuthAccountState.data().primaryAuthHouseholdID;
                      state.notesPage.parentID = null;
                      break;
                    default:
                      const page = NotesPageState.findID(e);

                      if (page.id === state.notesPage.id) {
                        return;
                      }

                      state.notesPage.authAccountID = page.authAccountID;
                      state.notesPage.authHouseholdID = page.authHouseholdID;
                      state.notesPage.parentID = page.id;
                  }
                },
                options: NotesPageState.getColorNamesIDs(),
                tooltip: AuthAccountState.translate(
                  WebNotesPagesIDParentPageTooltip,
                ),
                value:
                  state.notesPage.parentID === null
                    ? state.notesPage.authAccountID === null
                      ? "household"
                      : "personal"
                    : state.notesPage.parentID,
              }),
              m(FormItem, {
                name: AuthAccountState.translate(WebAdminNotificationsBody),
                textArea: {
                  oninput: (e: string): void => {
                    state.notesPageVersion.body = e;
                  },
                  required: true,
                  value: state.notesPageVersion.body,
                },
                tooltip: "Page contents",
              }),
            ],
          )
        : m("div.NotesPageID", [
            m(Title, {
              buttonLeft: {
                accent: true,
                icon:
                  state.notesPage.deleted === null
                    ? Icons.Delete
                    : Icons.DeleteForever,
                name:
                  state.notesPage.deleted === null
                    ? "Delete"
                    : "Delete Forever",
                onclick: async (): Promise<void> => {
                  if (state.notesPage.deleted === null) {
                    const page = NotesPageState.findID(m.route.param().id);
                    page.deleted = Timestamp.now().toString();
                    return NotesPageState.update(page).then(() => {
                      page.authAccountID === null
                        ? m.route.set("/notes/household")
                        : m.route.set("/notes/personal");
                    });
                  }

                  return NotesPageState.delete(state.notesPage.id).then(() => {
                    m.route.set(`/notes/${m.route.param().tag}`);
                  });
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Notes,
                  true,
                  state.notesPage.authHouseholdID,
                ),
                requireOnline: true,
              },
              buttonRight: {
                icon:
                  state.notesPage.deleted === null &&
                  m.route.param().version === undefined
                    ? Icons.Edit
                    : Icons.Restore,
                name:
                  state.notesPage.deleted === null &&
                  m.route.param().version === undefined
                    ? "Edit"
                    : "Restore",
                onclick: async (): Promise<void> => {
                  if (
                    state.notesPage.deleted !== null ||
                    m.route.param().version !== undefined
                  ) {
                    if (m.route.param().version !== undefined) {
                      await NotesPageVersionState.create(
                        state.notesPageVersion,
                      );
                    }

                    state.notesPage.deleted = null;
                    return NotesPageState.update(state.notesPage).then(() => {
                      state.edit(false);
                      m.route.set(
                        `/notes/${
                          state.notesPage.authAccountID === null
                            ? "household"
                            : "personal"
                        }/${m.route.param().id}`,
                        {},
                        {
                          state: {
                            key: Date.now(),
                          },
                        },
                      );
                    });
                  }

                  m.route.set(
                    `/notes/${
                      state.notesPage.authAccountID === null
                        ? "household"
                        : "personal"
                    }/${state.notesPage.id}?edit`,
                    {},
                    {
                      state: {
                        key: Date.now(),
                      },
                    },
                  );
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Notes,
                  true,
                  state.notesPage.authHouseholdID,
                ),
                primary:
                  m.route.param().version !== undefined ||
                  state.notesPage.deleted !== null,
                requireOnline: true,
              },
              loaded: loaded,
              name:
                state.notesPage.name === "" ? "New Page" : state.notesPage.name,
            }),
            loaded
              ? [
                  m(
                    "div.NotesPageID__body",
                    {
                      id: "notes-body",
                    },
                    [
                      state.notesPageVersion.body.match(/#+ \w/) === null // eslint-disable-line @typescript-eslint/prefer-regexp-exec
                        ? []
                        : m(
                            "div.NotesPageID__toc",
                            {
                              id: "toc",
                            },
                            [
                              m("p", "On this page:"),
                              m(
                                "div",
                                state.notesPageVersion.body.split("\n").reduce(
                                  (
                                    state: {
                                      codeBlock: boolean;
                                      components: m.Vnode[];
                                    },
                                    line,
                                  ) => {
                                    if (line.startsWith("```")) {
                                      state.codeBlock = !state.codeBlock;
                                    } else if (
                                      !state.codeBlock &&
                                      line.includes("# ")
                                    ) {
                                      state.components.push(
                                        m(
                                          "a.GlobalLink",
                                          {
                                            href: `${m.parsePathname(m.route.get()).path}#h${StringToID(line)}`,
                                          },
                                          [
                                            `${"-".repeat(line.split("#").length - 2)} `,
                                            m("span", line.split("# ")[1]),
                                          ],
                                        ),
                                      );
                                    }

                                    return state;
                                  },
                                  {
                                    codeBlock: false,
                                    components: [] as m.Vnode[],
                                  },
                                ).components,
                              ),
                            ],
                          ),
                      m(
                        "div",
                        m(Markdown, {
                          value: state.notesPageVersion.body,
                        }),
                      ),
                    ],
                  ),
                  m("div.GlobalFooter", [
                    state.notesPage.tags.length > 0
                      ? m(FormItemInput, {
                          disabled: true,
                          icon: Icons.Tag,
                          name: "tags",
                          type: "text",
                          value: state.notesPage.tags,
                          valueLinkPrefix: "/notes/",
                        })
                      : [],
                    m(
                      "span.NotesPageID__modified",
                      {
                        id: "updated",
                      },
                      [
                        `${AuthAccountState.translate(FormLastUpdated)}: `,
                        m(
                          m.route.Link,
                          {
                            href: `/notes/${m.route.param().tag}/${m.route.param().id}/versions`,
                          },
                          AppState.formatCivilDate(
                            Timestamp.fromString(
                              state.notesPageVersion.updated!,
                            ) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                              .toCivilDate()
                              .toJSON(),
                          ),
                        ),
                      ],
                    ),
                  ]),
                ]
              : m(FormLoading),
          ]);
    },
  };
}
