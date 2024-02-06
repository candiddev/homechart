import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemPlanProject } from "../components/FormItemPlanProject";
import { AuthAccountState } from "../states/AuthAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { GlobalState } from "../states/Global";
import type { PlanProject } from "../states/PlanProject";
import { PlanProjectState } from "../states/PlanProject";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectBudget,
  ObjectCategory,
  ObjectProject,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalTags,
  WebGlobalTagsTooltip,
} from "../yaml8n";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";

export function FormOverlayPlanProject(): m.Component<
  FormOverlayComponentAttrs<PlanProject>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectProject),
          onDelete: async (): Promise<void | Err> => {
            return PlanProjectState.delete(vnode.attrs.data.id).then(() => {
              if (
                m.route
                  .get()
                  .includes(`/plan/tasks?project=${vnode.attrs.data.id}`)
              ) {
                m.route.set("/plan/tasks?filter=today", "", {
                  state: {
                    key: Date.now(),
                  },
                });
              }
            });
          },
          onSubmit: async (): Promise<PlanProject | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return PlanProjectState.create(vnode.attrs.data);
            }

            return PlanProjectState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Plan,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Plan,
          }),
          m(FormItem, {
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.name = e;
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormItemSelectColor, {
            oninput: (e) => {
              vnode.attrs.data.color = e;
            },
            value: vnode.attrs.data.color,
          }),
          m(FormItemPlanProject, vnode.attrs.data),
          m(FormItem, {
            input: {
              datalist: PlanProjectState.tagNames(),
              type: "text",
              value: vnode.attrs.data.tags,
            },
            name: AuthAccountState.translate(WebGlobalTags),
            tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
          }),
          m(FormItem, {
            name: `${AuthAccountState.translate(ObjectBudget)} ${AuthAccountState.translate(ObjectCategory)}`,
            select: {
              oninput: (e: string): void => {
                if (e === "") {
                  vnode.attrs.data.budgetCategoryID = null;
                } else {
                  vnode.attrs.data.budgetCategoryID =
                    BudgetCategoryState.findGroupName(e).id;
                }
              },
              options: ["", ...BudgetCategoryState.names()],
              value: BudgetCategoryState.findIDHeaderName(
                vnode.attrs.data.budgetCategoryID,
              ),
            },
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          m(FormItemInputIcon, {
            oninput: (e: string): void => {
              vnode.attrs.data.icon = e;
            },
            value: vnode.attrs.data.icon,
          }),
        ],
      );
    },
  };
}
