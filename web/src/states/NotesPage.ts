import type { FormItemSelectNestedSelector } from "@lib/components/FormItemSelectNested";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Icons } from "@lib/types/Icons";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";
import { Sort } from "@lib/utilities/Sort";

import { DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import {
  ObjectHousehold,
  ObjectNoteCreated,
  ObjectNoteDeleted,
  ObjectNoteUpdated,
  WebGlobalPersonal,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";

export interface NotesPage {
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  children?: NotesPage[]; // not sent by API
  color: string;
  created: NullTimestamp;
  deleted: NullTimestamp;
  icon: string;
  id: NullUUID;
  name: string;
  parentID: NullUUID;
  shortID: string;
  tags: string[];
  updated: NullUUID;
}

class NotesPageManager extends DataArrayManager<NotesPage> {
  household = this.nested.map((pages) => {
    return pages.filter((page) => {
      return page.deleted === null && page.authHouseholdID !== null;
    });
  });
  personal = this.nested.map((pages) => {
    return pages.filter((page) => {
      return (
        page.authHouseholdID === null &&
        page.deleted === null &&
        page.authAccountID === AuthAccountState.data().id
      );
    });
  });

  constructor() {
    super("/api/v1/notes/pages", "name", false, DataTypeEnum.NotesPage);
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
        msg = AuthAccountState.translate(ObjectNoteCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectNoteDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectNoteUpdated);
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

  findNamesChildren(
    level: number,
    children?: NotesPage[],
  ): FormItemSelectNestedSelector[] {
    let names: FormItemSelectNestedSelector[] = [];
    if (children !== undefined) {
      for (const page of children) {
        names.push({
          color: page.color,
          icon: page.icon === "" ? Icons.Notes : page.icon,
          id: page.id,
          level: level,
          name: page.name,
        });

        if (Array.isArray(page.children) && page.children.length !== 0) {
          names = names.concat(
            this.findNamesChildren(level + 1, page.children),
          );
        }
      }
    }
    return names;
  }

  override findTag(tag: string, pages?: NotesPage[]): NotesPage[] {
    if (pages === undefined) {
      pages = this.data(); // eslint-disable-line no-param-reassign
    }

    const tagPages = pages.filter((page) => {
      if (page.tags !== null) {
        return page.tags.includes(tag);
      }

      return false;
    });

    Sort(tagPages, {
      property: "name",
    });
    return tagPages;
  }

  getColorNamesIDs(): FormItemSelectNestedSelector[] {
    let names: FormItemSelectNestedSelector[] = [];
    names.push({
      id: "personal",
      level: 0,
      name: AuthAccountState.translate(WebGlobalPersonal),
    });
    names = names.concat(
      this.findNamesChildren(
        1,
        FilterSortChildren({
          input: this.data().filter((page) => {
            return (
              page.deleted === null &&
              page.authAccountID === AuthAccountState.data().id
            );
          }),
        }),
      ),
    );

    if (
      Permission.isPermitted(
        AuthSessionState.data().permissionsHouseholds,
        PermissionComponentsEnum.Notes,
        PermissionEnum.Edit,
      )
    ) {
      names.push({
        id: "household",
        level: 0,
        name: AuthAccountState.translate(ObjectHousehold),
      });
      names = names.concat(
        this.findNamesChildren(
          1,
          FilterSortChildren({
            input: this.data().filter((page) => {
              return page.deleted === null && page.authHouseholdID !== null;
            }),
          }),
        ),
      );
    }

    return names;
  }

  override new(): NotesPage {
    return {
      authAccountID: null,
      authHouseholdID: null,
      color: "",
      created: null,
      deleted: null,
      icon: "",
      id: null,
      name: "",
      parentID: null,
      shortID: "",
      tags: [],
      updated: null,
    };
  }
}

export const NotesPageState = new NotesPageManager();
