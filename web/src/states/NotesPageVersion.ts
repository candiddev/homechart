import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Clone } from "@lib/utilities/Clone";

import { DataTypeEnum } from "../types/DataType";
import {
  ObjectVersionCreated,
  ObjectVersionDeleted,
  ObjectVersionUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";

export interface NotesPageVersion {
  body: string;
  createdBy: NullUUID;
  id: NullUUID;
  notesPageID: NullUUID;
  updated: NullTimestamp;
}

class NotesPageVersionManager extends DataArrayManager<NotesPageVersion> {
  constructor() {
    super(
      "/api/v1/notes/page-versions",
      "updated",
      true,
      DataTypeEnum.NotesPageVersion,
    );
  }

  override alertAction(
    a: ActionsEnum,
    hideAlert?: boolean,
    actions?: {
      name: string;
      onclick(): Promise<void>;
    }[],
  ): void {
    let msg = "";

    switch (a) {
      case ActionsEnum.Create:
        msg = AuthAccountState.translate(ObjectVersionCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectVersionDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectVersionUpdated);
        break;
    }

    AppState.setLayoutAppAlert(
      {
        actions: actions,
        message: msg,
      },
      hideAlert,
    );
  }

  findNotesPageIDAll(notesPageID: NullUUID): NotesPageVersion[] {
    return this.data().filter((version) => {
      return version.notesPageID === notesPageID;
    });
  }

  findNotesPageIDLatest(notesPageID: NullUUID): NotesPageVersion {
    for (const version of this.data()) {
      if (version.notesPageID === notesPageID) {
        return Clone(version);
      }
    }

    return this.new();
  }

  override new(): NotesPageVersion {
    return {
      body: "",
      createdBy: null,
      id: null,
      notesPageID: null,
      updated: null,
    };
  }
}

export const NotesPageVersionState = new NotesPageVersionManager();
