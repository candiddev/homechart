import { ButtonArray } from "@lib/components/ButtonArray";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayBookmark } from "../components/FormOverlayBookmark";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import type { Bookmark } from "../states/Bookmark";
import { BookmarkState } from "../states/Bookmark";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectBookmarks,
  ObjectHousehold,
  ObjectLink,
  WebBookmarksSearch,
  WebFormOverlayBookmarkShowHome,
  WebGlobalActionShowTag,
  WebGlobalAll,
  WebGlobalName,
  WebGlobalPersonal,
  WebGlobalTag,
} from "../yaml8n";

export function Bookmarks(): m.Component {
  const state: {
    columns: Stream<FilterType>;
    filter: Stream<string>;
    search: Stream<string>;
    sort: Stream<{
      invert: boolean;
      property: string;
    }>;
    tag: Stream<string>;
    tags: string[];
  } = {
    columns: Stream<FilterType>({
      name: "",
      link: "", // eslint-disable-line sort-keys
      home: "", // eslint-disable-line sort-keys
    }),
    filter: Stream(""),
    search: Stream(""),
    sort: Stream({
      invert: false as boolean, // eslint-disable-line @typescript-eslint/consistent-type-assertions
      property: "name",
    }),
    tag: Stream(""),
    tags: [],
  };

  const bookmarks = Stream.lift(
    (bookmarks, columns, filter, search, sort, tag) => {
      const data = BookmarkState.filter(
        bookmarks,
        false,
        filter,
        search,
        tag,
        (bookmark) => {
          return (
            bookmark.name.toLowerCase().includes(search) ||
            bookmark.link.toLowerCase().includes(search)
          );
        },
      );

      data.data = Filter.array(data.data, columns, sort);

      state.tags = data.tags;

      m.redraw();

      return data.data;
    },
    BookmarkState.data,
    state.columns,
    state.filter,
    state.search,
    state.sort,
    state.tag,
  );

  function bookmarkName(): m.Component<Bookmark> {
    return {
      oninit: (): void => {
        if (AppState.getSessionDisplay() < DisplayEnum.Small) {
          state.columns({
            name: "",
            home: "", // eslint-disable-line sort-keys
          });
        }
      },
      view: (vnode): m.Children => {
        return m(
          "div",
          {
            style: {
              "align-items": "flex-start",
              display: "flex",
              "flex-direction": "column",
            },
          },
          [
            vnode.attrs.name,
            m(ButtonArray, {
              icon: Icons.Tag,
              name: AuthAccountState.translate(WebGlobalTag),
              onclick: (e): void => {
                state.tag(state.tag() === e ? "" : e);
              },
              selected: () => {
                return [state.tag()];
              },
              small: true,
              value: vnode.attrs.tags,
            }),
          ],
        );
      },
    };
  }

  return {
    oninit: async (): Promise<void> => {
      if (AppState.getSessionDisplay() < DisplayEnum.Small) {
        state.columns({
          name: "",
        });
      }

      AppState.setLayoutApp({
        ...GetHelp("bookmarks"),
        breadcrumbs: [
          {
            name: AuthAccountState.translate(ObjectBookmarks),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newBookmark],
      });

      if (m.route.param().filter !== undefined) {
        state.filter(m.route.param().filter);
      }
    },
    view: (): m.Children => {
      return [
        m(Table, {
          actions: [],
          data: bookmarks(),
          editOnclick: (bookmark: Bookmark) => {
            AppState.setLayoutAppForm(FormOverlayBookmark, bookmark);
          },
          filters: [
            {
              icon: Icons.Tag,
              name: AuthAccountState.translate(WebGlobalActionShowTag),
              onclick: (e): void => {
                state.tag(state.tag() === e ? "" : e);
              },
              selected: (): string[] => {
                return [state.tag()];
              },
              value: state.tags,
            },
          ],
          loaded: BookmarkState.isLoaded(),
          search: {
            onsearch: (e) => {
              state.search(e);
            },
            placeholder: AuthAccountState.translate(WebBookmarksSearch),
          },
          sort: state.sort,
          tableColumns: [
            {
              name: AuthAccountState.translate(WebGlobalName),
              property: "name",
              render: bookmarkName,
              sortFormatter: (b: Bookmark): string => {
                return b.name;
              },
            },
            {
              checkboxOnclick: async (data: Bookmark): Promise<void | Err> => {
                data.home = !data.home;

                return BookmarkState.update(data);
              },
              name: AuthAccountState.translate(WebFormOverlayBookmarkShowHome),
              permitted: (b: Bookmark): boolean => {
                return GlobalState.permitted(
                  PermissionComponentsEnum.Auth,
                  true,
                  b.authHouseholdID,
                );
              },
              property: "home",
              type: TableDataType.Checkbox,
            },
            {
              name: AuthAccountState.translate(ObjectLink),
              property: "link",
            },
            TableColumnHousehold(),
          ],
          tableColumnsNameEnabled: state.columns,
          title: {
            tabs: [
              {
                active: state.filter() === "",
                href: "/bookmarks",
                name: AuthAccountState.translate(WebGlobalAll),
              },
              {
                active: state.filter() === "personal",
                href:
                  state.filter() === "personal"
                    ? "/bookmarks"
                    : "/bookmarks?filter=personal",
                name: AuthAccountState.translate(WebGlobalPersonal),
              },
              {
                active: state.filter() === "household",
                href:
                  state.filter() === "household"
                    ? "/bookmarks"
                    : "/bookmarks?filter=household",
                name: AuthAccountState.translate(ObjectHousehold),
              },
            ],
          },
        }),
      ];
    },
  };
}
