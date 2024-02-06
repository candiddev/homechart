import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { RewardCard } from "../states/RewardCard";
import { RewardCardState } from "../states/RewardCard";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectCard,
  ObjectReward,
  WebFormOverlayRewardCardAlwaysRedeemable,
  WebFormOverlayRewardCardRecipients,
  WebFormOverlayRewardCardRecipientsTooltip,
  WebFormOverlayRewardCardRewardStampCount,
  WebFormOverlayRewardCardRewardStampCountTooltip,
  WebFormOverlayRewardCardRewardStampGoal,
  WebFormOverlayRewardCardRewardStampGoalTooltip,
  WebFormOverlayRewardCardRewardTooltip,
  WebFormOverlayRewardCardSenders,
  WebFormOverlayRewardCardSendersTooltip,
  WebGlobalDetails,
  WebGlobalDetailsTooltips,
  WebGlobalName,
  WebGlobalNameTooltip,
} from "../yaml8n";

export function FormOverlayRewardCard(): m.Component<
  FormOverlayComponentAttrs<RewardCard>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectCard),
          onDelete: async (): Promise<void | Err> => {
            return RewardCardState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<RewardCard | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return RewardCardState.create(vnode.attrs.data);
            }

            return RewardCardState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Reward,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItem, {
            input: {
              oninput: (e) => {
                vnode.attrs.data.name = e;
              },
              type: "text",
              value: vnode.attrs.data.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormCheckbox, {
            name: AuthAccountState.translate(
              WebFormOverlayRewardCardAlwaysRedeemable,
            ),
            onclick: () => {
              vnode.attrs.data.invert = !vnode.attrs.data.invert;
            },
            value: vnode.attrs.data.invert,
          }),
          vnode.attrs.data.invert
            ? []
            : m(FormItem, {
                input: {
                  oninput: (e) => {
                    vnode.attrs.data.details = e;
                  },
                  type: "text",
                  value: vnode.attrs.data.details,
                },
                name: AuthAccountState.translate(WebGlobalDetails),
                tooltip: AuthAccountState.translate(WebGlobalDetailsTooltips),
              }),
          m(FormItem, {
            input: {
              oninput: (e) => {
                vnode.attrs.data.reward = e;
              },
              type: "text",
              value: vnode.attrs.data.reward,
            },
            name: AuthAccountState.translate(ObjectReward),
            tooltip: AuthAccountState.translate(
              WebFormOverlayRewardCardRewardTooltip,
            ),
          }),
          m(FormItem, {
            input: {
              oninput: (e) => {
                const int = parseInt(e, 10);

                if (!isNaN(int)) {
                  vnode.attrs.data.stampGoal = int;
                }
              },
              type: "number",
              value: vnode.attrs.data.stampGoal,
            },
            name: vnode.attrs.data.invert
              ? AuthAccountState.translate(
                  WebFormOverlayRewardCardRewardStampCount,
                )
              : AuthAccountState.translate(
                  WebFormOverlayRewardCardRewardStampGoal,
                ),
            tooltip: vnode.attrs.data.invert
              ? AuthAccountState.translate(
                  WebFormOverlayRewardCardRewardStampCountTooltip,
                )
              : AuthAccountState.translate(
                  WebFormOverlayRewardCardRewardStampGoalTooltip,
                ),
          }),
          m(FormItemSelectAuthHouseholdMembers, {
            authHouseholdID: vnode.attrs.data.authHouseholdID,
            members: vnode.attrs.data.senders,
            multiple: true,
            name: AuthAccountState.translate(WebFormOverlayRewardCardSenders),
            oninput: (members: string[]) => {
              vnode.attrs.data.senders = members;
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayRewardCardSendersTooltip,
            ),
          }),
          m(FormItemSelectAuthHouseholdMembers, {
            authHouseholdID: vnode.attrs.data.authHouseholdID,
            members: vnode.attrs.data.recipients,
            multiple: true,
            name: AuthAccountState.translate(
              WebFormOverlayRewardCardRecipients,
            ),
            oninput: (members: string[]) => {
              vnode.attrs.data.recipients = members;
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayRewardCardRecipientsTooltip,
            ),
          }),
        ],
      );
    },
  };
}
