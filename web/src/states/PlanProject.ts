import type { FormItemSelectNestedSelector } from "@lib/components/FormItemSelectNested";
import type { IconName } from "@lib/components/Icon";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { Icons } from "@lib/types/Icons";
import { Clone } from "@lib/utilities/Clone";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";
import { Sort } from "@lib/utilities/Sort";
import Stream from "mithril/stream";

import { DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import {
  ObjectHousehold,
  ObjectProjectCreated,
  ObjectProjectDeleted,
  ObjectProjectUpdated,
  WebGlobalPersonal,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import { DataArrayManager } from "./DataArray";
import type { PlanTaskTemplateType } from "./PlanTask";
import { PlanTaskState } from "./PlanTask";

export interface PlanProject {
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  budgetCategoryID: NullUUID;
  children?: PlanProject[]; // not sent by API
  color: string;
  created: NullTimestamp;
  icon: IconName;
  id: NullUUID;
  name: string;
  parentID: NullUUID;
  position: string;
  planTaskCount: number;
  shopItemCount: number;
  shortID: string;
  tags: string[];
  templateType?: PlanTaskTemplateType; // not sent by API
  updated: NullTimestamp;
}

class PlanProjectManager extends DataArrayManager<PlanProject> {
  allTags = Stream.lift(
    (projectTags, taskTags) => {
      const tags = [...taskTags];

      for (const tag of projectTags) {
        const i = taskTags.findIndex((tt) => {
          return tt.name === tag.name;
        });

        if (i === -1) {
          tags.push(tag);
        } else {
          tags[i].count += tag.count;
        }
      }

      Sort(tags, {
        property: "name",
      });

      return tags;
    },
    this.tags,
    PlanTaskState.tags,
  );
  allTagNames = this.allTags.map((tags) => {
    return tags.map((tag) => {
      return tag.name;
    });
  });

  household = this.nested.map((projects) => {
    return projects.filter((project) => {
      return project.authHouseholdID !== null;
    });
  });
  personal = this.nested.map((projects) => {
    return projects.filter((project) => {
      return project.authAccountID === AuthAccountState.data().id;
    });
  });

  constructor() {
    super("/api/v1/plan/projects", "name", false, DataTypeEnum.PlanProject);
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
        msg = AuthAccountState.translate(ObjectProjectCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectProjectDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectProjectUpdated);
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

  override async create(
    t: PlanProject,
    hideAlert?: boolean,
  ): Promise<PlanProject | Err> {
    return super
      .create(
        {
          ...t,
          ...{
            children: undefined,
            id: null,
            shortID: "",
          },
        },
        hideAlert,
      )
      .then(async (n) => {
        if (IsErr(n)) {
          return n;
        }

        if (t.shortID !== "") {
          for (const a of PlanTaskState.findPlanProjectID(
            PlanProjectState.findShortID(t.shortID).id,
          )) {
            const task = Clone(a);
            task.authAccountID = n.authAccountID;
            task.authHouseholdID = n.authHouseholdID;
            task.planProjectID = n.id;

            await PlanTaskState.create(task, true);
          }
        }

        return n;
      });
  }

  findAdjacent(p: PlanProject): PlanProject[] {
    return this.data().filter((project) => {
      if (p.parentID !== null) {
        return p.parentID === project.parentID;
      } else if (p.authHouseholdID !== null) {
        return project.parentID === null && project.authHouseholdID !== null;
      }
      return project.parentID === null && project.authHouseholdID === null;
    });
  }

  findChildren(parentID: NullUUID, projects?: PlanProject[]): PlanProject[] {
    if (projects === undefined) {
      projects = this.data(); // eslint-disable-line no-param-reassign
    }

    const project = FilterSortChildren({
      input: projects,
      rootID: parentID,
    });
    if (project.length > 0 && project[0].children !== undefined) {
      return project[0].children;
    }
    return [];
  }

  findCountChildren(project: PlanProject): number {
    let output = 0;
    if (project.children === undefined) {
      return output;
    }

    for (const child of project.children) {
      output += child.planTaskCount + child.shopItemCount;
      output += this.findCountChildren(child);
    }

    return output;
  }

  findCount(project: PlanProject): number {
    let output = project.planTaskCount + project.shopItemCount;
    if (AuthAccountState.data().collapsedPlanProjects.includes(project.id!)) {
      // eslint-disable-line @typescript-eslint/no-non-null-assertion
      output += this.findCountChildren(project);
    }

    return output;
  }

  findNamesBudgetCategoryID(budgetCategoryID: NullUUID): PlanProject[] {
    const projects: PlanProject[] = [];

    if (budgetCategoryID === null) {
      return projects;
    }

    for (const project of this.data()) {
      if (project.budgetCategoryID === budgetCategoryID) {
        projects.push(project);
      }
    }

    return projects;
  }

  findNamesChildren(
    level: number,
    children?: PlanProject[],
  ): FormItemSelectNestedSelector[] {
    let names: FormItemSelectNestedSelector[] = [];

    if (children !== undefined) {
      for (const project of children) {
        names.push({
          color: project.color,
          icon: project.icon === "" ? Icons.PlanProject : project.icon,
          id: project.id,
          level: level,
          name: project.name,
        });
        if (Array.isArray(project.children) && project.children.length !== 0) {
          names = names.concat(
            this.findNamesChildren(level + 1, project.children),
          );
        }
      }
    }
    return names;
  }

  override findTag(tag: string, projects?: PlanProject[]): PlanProject[] {
    if (projects === undefined) {
      projects = this.data(); // eslint-disable-line no-param-reassign
    }

    const tagProjects = projects.filter((project) => {
      if (project.tags !== null) {
        return project.tags.includes(tag);
      }

      return false;
    });

    Sort(tagProjects, {
      property: "name",
    });
    return tagProjects;
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
          input: this.data().filter((project) => {
            return project.authAccountID === AuthAccountState.data().id;
          }),
        }),
      ),
    );

    if (
      Permission.isPermitted(
        AuthSessionState.data().permissionsHouseholds,
        PermissionComponentsEnum.Plan,
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
            input: this.data().filter((project) => {
              return project.authHouseholdID !== null;
            }),
          }),
        ),
      );
    }
    return names;
  }

  override new(): PlanProject {
    const p = Permission.isPermitted(
      AuthSessionState.data().permissionsHouseholds,
      PermissionComponentsEnum.Plan,
      PermissionEnum.Edit,
      AuthAccountState.data().primaryAuthHouseholdID,
    );

    return {
      authAccountID: p ? null : AuthAccountState.data().id,
      authHouseholdID: p
        ? AuthAccountState.data().primaryAuthHouseholdID
        : null,
      budgetCategoryID: null,
      color: "",
      created: null,
      icon: "" as IconName,
      id: null,
      name: "",
      parentID: null,
      planTaskCount: 0,
      position: "",
      shopItemCount: 0,
      shortID: "",
      tags: [],
      updated: null,
    };
  }
}

export const PlanProjectState = new PlanProjectManager();
