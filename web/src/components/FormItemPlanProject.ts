import { FormItemSelectNested } from "@lib/components/FormItemSelectNested";
import { Animate, Animation } from "@lib/utilities/Animate";
import { ActionNone } from "@lib/yaml8n";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { PlanProjectState } from "../states/PlanProject";
import {
  ObjectParentProject,
  ObjectProject,
  WebFormItemPlanProjectParentTooltip,
  WebFormItemPlanProjectTooltip,
} from "../yaml8n";

export interface FormItemPlanProjectAttrs {
  /** AuthAccountID for PlanProject. */
  authAccountID: NullUUID;

  /** AuthHouseholdID for PlanProject. */
  authHouseholdID: NullUUID;

  /** ID of the PlanProject. */
  id?: NullUUID;
  oninput?(e: string): void;

  /** ParentID to use for the PlanProject, used for non-PlanProject. */
  parentID?: NullUUID;

  /** PlanProjectID to use for the PlanProject. */
  planProjectID?: NullUUID;
}

export function FormItemPlanProject(): m.Component<FormItemPlanProjectAttrs> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.Fade),
    view: (vnode): m.Children => {
      return m(FormItemSelectNested, {
        name:
          vnode.attrs.planProjectID === undefined
            ? AuthAccountState.translate(ObjectParentProject)
            : AuthAccountState.translate(ObjectProject),
        onselect: (e: string): void => {
          if (vnode.attrs.oninput !== undefined) {
            vnode.attrs.oninput(e);
          }

          switch (e) {
            case "personal":
              vnode.attrs.authAccountID = AuthAccountState.data().id;
              vnode.attrs.authHouseholdID = null;
              vnode.attrs.parentID = null;
              if (vnode.attrs.planProjectID !== undefined) {
                vnode.attrs.planProjectID = null;
              }
              break;
            case "household":
              vnode.attrs.authHouseholdID =
                AuthAccountState.data().primaryAuthHouseholdID;
              vnode.attrs.parentID = null;
              if (vnode.attrs.planProjectID === undefined) {
                vnode.attrs.authAccountID = null;
              } else {
                vnode.attrs.planProjectID = null;
              }
              break;
            default:
              const project = PlanProjectState.findID(e);

              if (project.id === vnode.attrs.id) {
                return;
              }

              vnode.attrs.authHouseholdID = project.authHouseholdID;
              if (vnode.attrs.planProjectID === undefined) {
                vnode.attrs.parentID = project.id;
                vnode.attrs.authAccountID = project.authAccountID;
              } else {
                if (
                  project.authAccountID !== null &&
                  vnode.attrs.authAccountID !== project.authAccountID
                ) {
                  // keep the task assignee, if project is a household project
                  vnode.attrs.authAccountID = project.authAccountID;
                }
                vnode.attrs.parentID = null;
                vnode.attrs.planProjectID = project.id;
              }
          }
        },
        options:
          vnode.attrs.oninput === undefined
            ? PlanProjectState.getColorNamesIDs()
            : [
                {
                  color: "",
                  id: null,
                  level: 0,
                  name: AuthAccountState.translate(ActionNone),
                },
                ...PlanProjectState.getColorNamesIDs(),
              ],
        tooltip:
          vnode.attrs.planProjectID === undefined
            ? AuthAccountState.translate(WebFormItemPlanProjectParentTooltip)
            : AuthAccountState.translate(WebFormItemPlanProjectTooltip),
        value:
          (vnode.attrs.planProjectID !== undefined &&
            vnode.attrs.planProjectID === null) ||
          (vnode.attrs.planProjectID === undefined &&
            vnode.attrs.parentID === null)
            ? vnode.attrs.authHouseholdID === null
              ? vnode.attrs.authAccountID === null
                ? null // null for value
                : "personal"
              : "household"
            : vnode.attrs.planProjectID === undefined
              ? vnode.attrs.parentID
              : vnode.attrs.planProjectID,
      });
    },
  };
}
