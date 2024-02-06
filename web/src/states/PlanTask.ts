import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import type { RecurrenceInterval } from "@lib/types/Recurrence";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import { Sort } from "@lib/utilities/Sort";
import type Stream from "mithril/stream";

import { Colors } from "../types/Colors";
import { DataTypeEnum } from "../types/DataType";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import {
  ObjectTaskCompleted,
  ObjectTaskCreated,
  ObjectTaskDeleted,
  ObjectTaskNextDate,
  ObjectTaskUpdated,
  WebGlobalActionUndo,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import type { CalendarEvent, CalendarEventRange } from "./CalendarEvent";
import { CalendarEventState } from "./CalendarEvent";
import { DataArrayManager } from "./DataArray";
import { PlanProjectState } from "./PlanProject";

export enum PlanTaskChildrenStatus {
  none,
  someDone,
  allDone,
}

export enum PlanTaskTemplateType {
  Account,
  Homechart,
  Household,
}

export interface PlanTask {
  assignees: string[];
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  children?: PlanTask[]; // not sent by API
  color: string;
  created: NullTimestamp;
  dateEnd: NullCivilDate;
  details: string;
  done: boolean;
  dueDate: NullTimestamp;
  duration: number;
  id: NullUUID;
  inventoryItemID: NullUUID;
  lastDoneBy: NullUUID;
  lastDoneDate: NullCivilDate;
  name: string;
  notify: boolean;
  parentID: NullUUID;
  planProjectID: NullUUID;
  position: string;
  recurOnDone: boolean;
  recurrence: RecurrenceInterval | null;
  shortID: string;
  tags: string[];
  template: boolean;
  updated: NullUUID;
}

class PlanTaskManager extends DataArrayManager<PlanTask> {
  undoComplete: PlanTask[] = [];

  dueDatePast = this.nested.map((nested) => {
    const today = CivilDate.now();

    const output: PlanTask[] = [];

    const filter = function (tasks: PlanTask[]): void {
      for (let i = 0; i < tasks.length; i++) {
        if (
          !tasks[i].template &&
          tasks[i].dueDate !== null &&
          Timestamp.fromString(tasks[i].dueDate as string).toCivilDate() < today
        ) {
          output.push(tasks[i]);
        }

        if (
          !tasks[i].template &&
          tasks[i].children !== undefined &&
          (tasks[i].children as PlanTask[]).length > 0
        ) {
          filter(tasks[i].children as PlanTask[]);
        }
      }
    };

    filter(nested);

    const midnight = Timestamp.midnight().toCivilTime().toString(true);
    Sort(output, {
      formatter: (task: PlanTask): string => {
        if (
          task.dueDate !== null &&
          Timestamp.fromString(task.dueDate).toCivilTime().toString(true) !==
            midnight
        ) {
          return `${task.dueDate}`;
        }
        return "9999";
      },
      property: "dueDate",
    });

    return output;
  });

  household = this.nested.map((tasks) => {
    return tasks.filter((task) => {
      return (
        task.authHouseholdID !== null &&
        task.planProjectID === null &&
        !task.template
      );
    });
  });
  personal = this.nested.map((tasks) => {
    return tasks.filter((task) => {
      return (
        task.authHouseholdID === null &&
        task.authAccountID === AuthAccountState.data().id &&
        task.planProjectID === null &&
        !task.template
      );
    });
  });
  templates = this.nested.map((tasks) => {
    return tasks.filter((task) => {
      return task.template;
    });
  });

  constructor() {
    super("/api/v1/plan/tasks", "name", false, DataTypeEnum.PlanTask);
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
        msg = AuthAccountState.translate(ObjectTaskCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectTaskDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectTaskUpdated);
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
    t: PlanTask,
    hideAlert?: boolean,
  ): Promise<PlanTask | Err> {
    let dueDateDiff = 0;

    if (t.shortID !== "" && t.dueDate !== null) {
      dueDateDiff = Timestamp.fromString(t.dueDate).getDiffDays(
        Timestamp.fromString(`${PlanTaskState.findShortID(t.shortID).dueDate}`),
      );
    }

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

        if (t.children !== undefined) {
          for (const task of t.children) {
            if (n.authHouseholdID === null) {
              task.authAccountID = n.authAccountID;
              task.authHouseholdID = null;
            } else {
              task.authAccountID = null;
              task.authHouseholdID = n.authHouseholdID;
            }

            if (t.dueDate !== null && dueDateDiff !== 0) {
              const dueDate = Timestamp.fromString(`${task.dueDate}`);
              dueDate.addDays(dueDateDiff);
              task.dueDate = dueDate.toString();
            }

            task.parentID = n.id;
            task.planProjectID = n.planProjectID;

            await this.create(task, true);
          }
        }

        return n;
      });
  }

  findAdjacent(t: PlanTask): PlanTask[] {
    return this.data().filter((task) => {
      if (t.parentID !== null) {
        return task.parentID === t.parentID;
      } else if (t.planProjectID !== null) {
        return task.parentID === null && task.planProjectID === t.planProjectID;
      } else if (t.authHouseholdID !== null) {
        return (
          task.parentID === null &&
          task.planProjectID === null &&
          task.authHouseholdID !== null
        );
      }

      return (
        task.parentID === null &&
        task.planProjectID === null &&
        task.authHouseholdID === null
      );
    });
  }

  findDueDate(date: NullCivilDate, nestedTasks?: PlanTask[]): PlanTask[] {
    return this.findDueDateTasks(
      date,
      nestedTasks === undefined ? this.nested() : nestedTasks,
    );
  }

  findDueDateTasks(date: NullCivilDate, children: PlanTask[]): PlanTask[] {
    let tasks: PlanTask[] = [];
    for (const task of children) {
      if (
        task.dueDate !== null &&
        Timestamp.fromString(task.dueDate)?.toCivilDate().toJSON() === date &&
        (task.authAccountID === null ||
          task.authAccountID === AuthAccountState.data().id)
      ) {
        tasks.push(task);
      } else if (task.children !== undefined && task.children.length > 0) {
        tasks = tasks.concat(this.findDueDateTasks(date, task.children));
      }
    }

    Sort(tasks, {
      invert: true,
      property: "priority",
    });
    const midnight = Timestamp.midnight();
    Sort(tasks, {
      formatter: (task: PlanTask): string => {
        if (
          task.dueDate !== null &&
          Timestamp.fromString(task.dueDate)?.timestamp !== midnight.timestamp
        ) {
          return `${task.dueDate}`;
        }

        return "9999";
      },
      property: "dueDate",
    });

    return tasks;
  }

  findInventoryItemID(
    inventoryItemID: NullUUID,
    tasks?: PlanTask[],
  ): PlanTask[] {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    if (inventoryItemID === null) {
      return [];
    }

    return tasks.filter((task) => {
      return task.inventoryItemID === inventoryItemID;
    });
  }

  findParentIDProjectID(parentID: NullUUID): NullUUID {
    let task = this.findID(parentID);

    while (task.parentID !== null) {
      task = this.findID(task.parentID);
    }

    return task.planProjectID;
  }

  findPlanProjectID(
    planProjectID: NullUUID,
    nestedTasks?: PlanTask[],
  ): PlanTask[] {
    if (planProjectID === null) {
      return [];
    }

    if (nestedTasks === undefined) {
      nestedTasks = this.nested(); // eslint-disable-line no-param-reassign
    }

    return nestedTasks.filter((task) => {
      return task.planProjectID === planProjectID;
    });
  }

  override findTag(tag: string, tasks?: PlanTask[]): PlanTask[] {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    const tagTasks = tasks.filter((task) => {
      if (task.tags !== null) {
        return task.tags.includes(tag);
      }

      return false;
    });

    Sort(tagTasks, {
      property: "dueDate",
    });
    return tagTasks;
  }

  findTemplates(type?: PlanTaskTemplateType): PlanTask[] {
    return this.templates().filter((task) => {
      switch (type) {
        case PlanTaskTemplateType.Account:
          return (
            task.authAccountID === AuthAccountState.data().id &&
            task.authHouseholdID === null
          );
        case PlanTaskTemplateType.Homechart:
          return task.authAccountID === null && task.authHouseholdID === null;
        case PlanTaskTemplateType.Household:
          return task.authHouseholdID !== null;
        default:
          return false;
      }
    });
  }

  getChildrenDone(task: PlanTask): PlanTaskChildrenStatus {
    if (task.children === undefined || task.children.length === 0) {
      return 0;
    }

    let allDone = 0;
    let someDone = 0;

    for (const child of task.children) {
      if (child.done) {
        allDone += 1;
      } else if (this.getChildrenDone(child) > PlanTaskChildrenStatus.none) {
        someDone += 1;
      }
    }

    if (allDone === task.children.length) {
      return 2;
    } else if (allDone > 0 || someDone > 0) {
      return 1;
    }

    return 0;
  }

  getCountHousehold(tasks?: PlanTask[]): number {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    return tasks.filter((task) => {
      return task.authHouseholdID !== null;
    }).length;
  }

  getCountPersonal(tasks?: PlanTask[]): number {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    return tasks.filter((task) => {
      return task.authHouseholdID === null;
    }).length;
  }

  getCountToday(tasks?: PlanTask[]): number {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    const today = tasks.filter((task) => {
      if (task.dueDate !== null) {
        return (
          Timestamp.fromString(task.dueDate).toCivilDate() <= CivilDate.now() &&
          !task.done &&
          (task.authAccountID === null ||
            task.authAccountID === AuthAccountState.data().id) &&
          !task.template
        );
      }

      return false;
    });

    return today.length;
  }

  getCountUpcoming(tasks?: PlanTask[]): number {
    if (tasks === undefined) {
      tasks = this.data(); // eslint-disable-line no-param-reassign
    }

    const upcoming = tasks.filter((task) => {
      if (task.dueDate !== null) {
        const dueDate = Timestamp.fromString(task.dueDate)
          .toCivilDate()
          .toJSON();
        const today = Timestamp.now();
        const week = Timestamp.fromString(today.toString());
        week.timestamp.setDate(week.timestamp.getDate() + 6);

        return (
          today.toCivilDate().toJSON() < dueDate &&
          week.toCivilDate().toJSON() >= dueDate &&
          !task.done &&
          (task.authAccountID === null ||
            task.authAccountID === AuthAccountState.data().id) &&
          !task.template
        );
      }

      return false;
    });

    return upcoming.length;
  }

  getDuration(tasks?: PlanTask[]): number {
    if (tasks === undefined || tasks.length === 0) {
      return 0;
    }

    return tasks
      .filter((task) => {
        return !task.done;
      })
      .reduce((total, task) => {
        return total + task.duration + this.getDuration(task.children);
      }, 0);
  }

  override getTaggable(): PlanTask[] {
    return this.data().filter((task) => {
      return !task.done;
    });
  }

  override new(): PlanTask {
    const tomorrow = Timestamp.midnight();
    tomorrow.timestamp.setDate(tomorrow.timestamp.getDate() + 1);
    const p = Permission.isPermitted(
      AuthSessionState.data().permissionsHouseholds,
      PermissionComponentsEnum.Plan,
      PermissionEnum.Edit,
      AuthAccountState.data().primaryAuthHouseholdID,
    );

    return {
      assignees: [],
      authAccountID: p ? null : AuthAccountState.data().id,
      authHouseholdID: p
        ? AuthAccountState.data().primaryAuthHouseholdID
        : null,
      color: "",
      created: null,
      dateEnd: null,
      details: "",
      done: false,
      dueDate: null,
      duration: 0,
      id: null,
      inventoryItemID: null,
      lastDoneBy: null,
      lastDoneDate: null,
      name: "",
      notify: false,
      parentID: null,
      planProjectID: null,
      position: "0",
      recurOnDone: false,
      recurrence: null,
      shortID: "",
      tags: [],
      template: false,
      updated: null,
    };
  }

  findDateRange(from: CivilDate, to: CivilDate): Stream<CalendarEventRange> {
    return this.data.map((tasks) => {
      const events: CalendarEvent[] = [];

      for (const task of tasks) {
        if (!task.done && task.dueDate !== null) {
          const d = Timestamp.fromString(task.dueDate);

          events.push({
            ...CalendarEventState.new(),
            ...{
              authAccountID: task.authAccountID,
              authHouseholdID: task.authHouseholdID,
              color: Colors.planTask(
                AuthHouseholdState.findID(task.authHouseholdID).preferences
                  .colorPlanTaskEvents,
                task.color,
              ),
              details:
                task.planProjectID === null
                  ? task.authHouseholdID === null
                    ? `[icon@${Icons.PlanProject} Personal](/tasks?filter=personal)`
                    : `[icon@${Icons.PlanProject} Household](/tasks?filter=household)`
                  : `#planproject/${PlanProjectState.findID(task.planProjectID).shortID}${
                      task.authHouseholdID === null ? "?p" : ""
                    }`,
              duration:
                d.toCivilTime().toString(true) === "00:00"
                  ? 0
                  : // TODO remove undefined check
                    task.duration === 0 || task.duration === undefined
                    ? 30
                    : task.duration,
              icon: "done_all",
              name: task.name,
              participants:
                task.authHouseholdID !== null && task.authAccountID !== null
                  ? [task.authAccountID]
                  : [],
              planTask: task,
              recurrence: task.recurrence,
              timeStart: d.toCivilTime().toString(true),
              timestampEnd: d.toString(),
              timestampStart: d.toString(),
            },
          });
        }
      }

      return CalendarEventState.toCalendarEventsRange(events, from, to);
    });
  }

  override async update(
    data: PlanTask,
    hideAlert?: boolean,
  ): Promise<void | Err> {
    const old = this.findID(data.id);

    if (
      old.dueDate !== null &&
      data.dueDate !== null &&
      old.dueDate !== data.dueDate &&
      data.children !== undefined &&
      data.children.length > 0
    ) {
      const oldDate = Timestamp.fromString(old.dueDate);
      const newDate = Timestamp.fromString(data.dueDate);
      const days = oldDate.getDiffDays(newDate);

      for (const child of data.children) {
        if (child.dueDate !== null) {
          const childDate = Timestamp.fromString(child.dueDate);
          childDate.addDays(days);
          child.dueDate = childDate.toJSON();

          await this.update(child, true);
        }
      }
    }

    delete data.children;

    return super.update(data, hideAlert);
  }

  async updateDone(task: PlanTask, done?: boolean): Promise<void | Err> {
    if (done === undefined) {
      this.undoComplete = [];
    }
    this.undoComplete.push(Clone(task));

    const t = Clone(task);

    if (t.recurrence === null && done !== undefined) {
      t.done = done;

      if (done) {
        t.lastDoneBy = AuthAccountState.data().id;
        t.lastDoneDate = CivilDate.now().toJSON();
      }
    } else if (t.recurrence === null || t.recurrence.separation === 0) {
      t.done = !t.done;

      if (t.done) {
        t.lastDoneBy = AuthAccountState.data().id;
        t.lastDoneDate = CivilDate.now().toJSON();
      }
    } else if (t.dueDate !== null) {
      t.lastDoneBy = AuthAccountState.data().id;
      t.lastDoneDate = CivilDate.now().toJSON();

      if (t.assignees.length > 0) {
        const i = t.assignees.indexOf(`${t.authAccountID}`);

        if (i < 0 || i === t.assignees.length - 1) {
          t.authAccountID = t.assignees[0];
        } else {
          t.authAccountID = t.assignees[i + 1];
        }
      }

      let timestamp = Timestamp.fromString(t.dueDate);
      const today = Timestamp.now();

      // If it's supposed to recur when done, set dueDate to today with the same time
      if (t.recurOnDone && timestamp.toCivilDate() < today.toCivilDate()) {
        timestamp.timestamp.setFullYear(today.timestamp.getFullYear());
        timestamp.timestamp.setDate(1);
        timestamp.timestamp.setMonth(today.timestamp.getMonth());
        timestamp.timestamp.setDate(today.timestamp.getDate());

        // Otherwise, recur the task
      } else {
        timestamp = Recurrence.nextTimestamp(t.recurrence, timestamp);
      }

      const tomorrow = today;
      tomorrow.timestamp.setDate(tomorrow.timestamp.getDate() + 1);

      while (
        timestamp.toCivilDate().valueOf() < tomorrow.toCivilDate().valueOf()
      ) {
        timestamp = Recurrence.nextTimestamp(t.recurrence, timestamp);
      }

      if (
        t.dateEnd !== undefined &&
        t.dateEnd !== null &&
        CivilDate.fromString(t.dateEnd) < timestamp.toCivilDate()
      ) {
        t.done = true;
      } else {
        t.done = false;
        t.dueDate = timestamp.toString();
      }
    }

    if (t.children !== undefined && t.children.length > 0) {
      for (const child of t.children) {
        await this.updateDone(child, t.done);
      }
    }

    delete t.children;

    return this.update(t, true).then((err) => {
      if (IsErr(err)) {
        return err;
      }

      if (done === undefined) {
        if (
          t.recurrence !== null &&
          t.recurrence.separation !== 0 &&
          t.dueDate !== null
        ) {
          AppState.setLayoutAppAlert({
            actions: [
              {
                name: AuthAccountState.translate(WebGlobalActionUndo),
                onclick: async (): Promise<void> => {
                  for (const undo of this.undoComplete) {
                    await this.update(undo, true);
                  }
                },
              },
            ],
            message: `${AuthAccountState.translate(ObjectTaskNextDate)} ${AppState.formatCivilDate(
              Timestamp.fromString(t.dueDate).toCivilDate(),
            )}`,
          });
        } else {
          AppState.setLayoutAppAlert({
            actions: [
              {
                name: AuthAccountState.translate(WebGlobalActionUndo),
                onclick: async (): Promise<void> => {
                  for (const undo of this.undoComplete) {
                    await this.update(undo, true);
                  }
                },
              },
            ],
            message: AuthAccountState.translate(ObjectTaskCompleted),
          });
        }
      }

      return;
    });
  }
}

export const PlanTaskState = new PlanTaskManager();
