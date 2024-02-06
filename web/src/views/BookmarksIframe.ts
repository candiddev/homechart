import { AppState } from "@lib/states/App";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { BookmarkState } from "../states/Bookmark";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectBookmarks } from "../yaml8n";

export function BookmarksIframe(): m.Component {
  let bookmark = BookmarkState.new();

  return {
    oninit: (): void => {
      bookmark = BookmarkState.findID(m.route.param().id);

      AppState.setLayoutApp({
        ...GetHelp("bookmarks"),
        breadcrumbs: [
          {
            link: "/bookmarks",
            name: AuthAccountState.translate(ObjectBookmarks),
          },
          {
            name: bookmark.name,
          },
        ],
        toolbarActionButtons: [],
      });

      m.redraw();
    },
    view: (): m.Children => {
      return m("iframe", {
        src: bookmark.link,
        style: {
          border: "none",
          height: "100%",
          width: "100%",
        },
      });
    },
  };
}
