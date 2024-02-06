import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Sort } from "@lib/utilities/Sort";
import Stream from "mithril/stream";

import { API } from "../services/API";
import { DataTypeEnum } from "../types/DataType";
import {
  ObjectCollectionCreated,
  ObjectCollectionDeleted,
  ObjectCollectionUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { DataArrayManager } from "./DataArray";
import { InventoryItemState } from "./InventoryItem";

export interface InventoryCollection {
  authHouseholdID: NullUUID;
  columns: {
    [key: string]: string | undefined;
  };
  created: NullTimestamp;
  grouping: string;
  icon: string;
  id: NullUUID;
  name: string;
  qrcode?: string; // not sent by API
  qrlink?: string; // not sent by API
  shortID: string;
  sort: {
    invert: boolean;
    property: string;
  };
  updated: NullTimestamp;
}

class InventoryCollectionManager extends DataArrayManager<InventoryCollection> {
  counts = Stream.lift(
    (collections, items) => {
      return collections.reduce(
        (c, d) => {
          c[d.id as string] = Filter.array(items, d.columns, {}).length;

          return c;
        },
        {} as {
          [key: string]: number;
        },
      );
    },
    this.data,
    InventoryItemState.data,
  );
  groupingNames = this.data.map((categories) => {
    const groupings: string[] = [];

    for (const category of categories) {
      if (category.grouping !== "" && !groupings.includes(category.grouping)) {
        groupings.push(category.grouping);
      }
    }
    Sort(groupings);
    return groupings;
  });

  constructor() {
    super(
      "/api/v1/inventory/collections",
      "name",
      false,
      DataTypeEnum.InventoryCollection,
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
        msg = AuthAccountState.translate(ObjectCollectionCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectCollectionDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectCollectionUpdated);
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

  getLink(id: NullUUID): string {
    return `${API.getLink()}/inventory/${id}`;
  }

  override new(): InventoryCollection {
    return {
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      columns: {},
      created: null,
      grouping: "",
      icon: "",
      id: null,
      name: "",
      shortID: "",
      sort: {
        invert: false,
        property: "name",
      },
      updated: null,
    };
  }

  toView(collection: InventoryCollection): {
    id: NullUUID;
    icon: string;
    link: string;
    name: string;
  } {
    return {
      icon: collection.icon === "" ? Icons.Filter : collection.icon,
      id: collection.id,
      link: `/inventory/${collection.id}`,
      name: collection.name,
    };
  }
}

export const InventoryCollectionState = new InventoryCollectionManager();
