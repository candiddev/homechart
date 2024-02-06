import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";

import { DataTypeEnum } from "../types/DataType";
import type { TableNotify } from "../types/TableNotify";
import {
  ObjectCardCreated,
  ObjectCardDeleted,
  ObjectCardUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { DataArrayManager } from "./DataArray";

export interface RewardCard {
  authHouseholdID: NullUUID;
  created: NullTimestamp;
  details: string;
  id: NullUUID;
  invert: boolean;
  name: string;
  recipients: string[];
  reward: string;
  senders: string[];
  shortID: string;
  stampCount: number;
  stampGoal: number;
  updated: NullTimestamp;
}

class RewardCardManager extends DataArrayManager<RewardCard> {
  constructor() {
    super("/api/v1/reward/cards", "name", false, DataTypeEnum.RewardCard);
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
        msg = AuthAccountState.translate(ObjectCardCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectCardDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectCardUpdated);
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

  findSent(cards: RewardCard[], id?: NullUUID): RewardCard[] {
    return cards.filter((card) => {
      return (
        card.senders.includes(`${AuthAccountState.data().id}`) &&
        (id === undefined ||
          (id !== undefined &&
            card.recipients.includes(
              `${AuthHouseholdState.findMember(`${id}`).id}`,
            )))
      );
    });
  }

  getInProgress(cards?: RewardCard[]): RewardCard[] {
    if (cards === undefined) {
      cards = this.data(); // eslint-disable-line no-param-reassign
    }

    return cards.filter((card) => {
      return (
        (!card.senders.includes(`${AuthAccountState.data().id}`) ||
          card.recipients.length === 0) &&
        !card.invert &&
        card.stampCount < card.stampGoal
      );
    });
  }

  getRedeemable(cards?: RewardCard[]): RewardCard[] {
    if (cards === undefined) {
      cards = this.data(); // eslint-disable-line no-param-reassign
    }

    return cards.filter((card) => {
      return (
        !card.senders.includes(`${AuthAccountState.data().id}`) &&
        ((card.invert && card.stampCount < card.stampGoal) ||
          (!card.invert && card.stampCount === card.stampGoal))
      );
    });
  }

  override new(): RewardCard {
    return {
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      created: null,
      details: "",
      id: null,
      invert: false,
      name: "",
      recipients: [],
      reward: "",
      senders: [`${AuthAccountState.data().id}`],
      shortID: "",
      stampCount: 0,
      stampGoal: 0,
      updated: null,
    };
  }

  override async onSSE(n: TableNotify): Promise<void> {
    if (n.id.startsWith("00000")) {
      return;
    }

    return super.onSSE(n);
  }

  async punch(card: RewardCard): Promise<void | Err> {
    if (!card.senders.includes(`${AuthAccountState.data().id}`)) {
      return;
    }

    card.stampCount++;

    if (card.stampCount > card.stampGoal) {
      return;
    }

    return this.update(card);
  }
}

export const RewardCardState = new RewardCardManager();
