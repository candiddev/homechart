import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemDuration } from "@lib/components/FormItemDuration";
import { FormItemInput } from "@lib/components/FormItemInput";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import { FormRecurrence } from "@lib/components/FormRecurrence";
import { Tooltip } from "@lib/components/Tooltip";
import type { Err } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { CivilTime } from "@lib/types/CivilTime";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import { Clone } from "@lib/utilities/Clone";
import { ActionDelete, ActionUpdate } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import type { CalendarEvent } from "../states/CalendarEvent";
import { CalendarEventState } from "../states/CalendarEvent";
import { GlobalState } from "../states/Global";
import { Translations } from "../states/Translations";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectEvent,
  WebFormOverlayCalendarEventAllDay,
  WebFormOverlayCalendarEventCustomReminder,
  WebFormOverlayCalendarEventCustomReminderTooltip,
  WebFormOverlayCalendarEventEndTime,
  WebFormOverlayCalendarEventEndTimeTooltip,
  WebFormOverlayCalendarEventLocation,
  WebFormOverlayCalendarEventLocationTooltip,
  WebFormOverlayCalendarEventParticipants,
  WebFormOverlayCalendarEventParticipantsTooltip,
  WebFormOverlayCalendarEventStartTime,
  WebFormOverlayCalendarEventStartTimeTooltip,
  WebFormOverlayCalendarEventTimeZoneTooltip,
  WebFormOverlayCalendarEventTravelTime,
  WebFormOverlayCalendarEventTravelTimeTooltip,
  WebGlobalActionCopy,
  WebGlobalDetails,
  WebGlobalDetailsTooltips,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalRecurring,
  WebGlobalSendReminder,
  WebGlobalSendReminderTooltip,
  WebGlobalTimeZone,
  WebRecurrenceOccurrence,
} from "../yaml8n";

function allDayDuration(duration: number): boolean {
  return duration === 0 || duration % (24 * 60) === 0;
}

function findReminderTime(offset: null | number): number {
  const index = Translations.calendarEventReminderTimes.findIndex(
    (reminder) => {
      return reminder.offset === offset;
    },
  );

  if (index < 0) {
    return 5;
  }

  return index;
}

export function FormOverlayCalendarEvent(): m.Component<
  FormOverlayComponentAttrs<CalendarEvent>
> {
  let notifyCustom = false;
  const dateStart = Stream("");
  const duration = Stream(0);
  const timeStart = Stream("");
  const start = Stream.lift(
    (d, t) => {
      return Timestamp.fromString(`${d}T${t}:00.000Z`);
    },
    dateStart,
    timeStart,
  );

  const end = Stream.lift(
    (d, s) => {
      const e = Timestamp.fromString(s.toString());
      e.addMinutes(d);
      m.redraw();

      return e;
    },
    duration,
    start,
  );

  let event = CalendarEventState.new();

  let names: string[] = [];

  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    oninit: async (vnode): Promise<void> => {
      names = (await import("moment-timezone")).default.tz.names();

      event = Clone(vnode.attrs.data);
      dateStart(vnode.attrs.data.dateStart);
      timeStart(vnode.attrs.data.timeStart);
      duration(vnode.attrs.data.duration);
      m.redraw();
    },
    onupdate: (vnode): void => {
      if (vnode.attrs.data.dateStart !== dateStart()) {
        dateStart(vnode.attrs.data.dateStart);
      }

      if (vnode.attrs.data.timeStart !== timeStart()) {
        timeStart(vnode.attrs.data.timeStart);
      }

      if (vnode.attrs.data.duration !== duration()) {
        duration(vnode.attrs.data.duration);
      }
    },
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [
            {
              accent: true,
              name: `${AuthAccountState.translate(ActionDelete)} ${AuthAccountState.translate(WebRecurrenceOccurrence)}`,
              onclick: async (): Promise<void> => {
                if (
                  vnode.attrs.data.recurrenceDate !== undefined &&
                  vnode.attrs.data.recurrenceDate !== null
                ) {
                  vnode.attrs.data.skipDays.push(
                    vnode.attrs.data.recurrenceDate,
                  );
                  return CalendarEventState.update(vnode.attrs.data).then(
                    async () => {
                      AppState.setLayoutAppForm();
                    },
                  );
                }
              },
              permitted:
                GlobalState.permitted(
                  PermissionComponentsEnum.Calendar,
                  true,
                ) &&
                vnode.attrs.data.id !== null &&
                vnode.attrs.data.recurrence !== null,
              requireOnline: true,
            },
            {
              name: AuthAccountState.translate(WebGlobalActionCopy),
              onclick: async (): Promise<void> => {
                return new Promise((resolve) => {
                  vnode.attrs.data.id = null;

                  return resolve();
                });
              },
              permitted:
                vnode.attrs.data.id !== null &&
                GlobalState.permitted(PermissionComponentsEnum.Calendar, true),
              requireOnline: true,
            },
            {
              name: `${AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(WebRecurrenceOccurrence)}`,
              onclick: async (): Promise<void> => {
                if (
                  vnode.attrs.data.recurrenceDate !== undefined &&
                  vnode.attrs.data.recurrenceDate !== null &&
                  !vnode.attrs.data.skipDays.includes(
                    vnode.attrs.data.recurrenceDate,
                  )
                ) {
                  event.skipDays.push(vnode.attrs.data.recurrenceDate);
                  await CalendarEventState.update(event);
                }

                if (
                  vnode.attrs.data.recurrenceDate !== undefined &&
                  vnode.attrs.data.recurrenceDate !== null
                ) {
                  vnode.attrs.data.dateStart = vnode.attrs.data.recurrenceDate;
                }

                vnode.attrs.data.id = null;
                vnode.attrs.data.recurrence = null;
                vnode.attrs.data.skipDays = [];
                return CalendarEventState.create(vnode.attrs.data).then(
                  async () => {
                    AppState.setLayoutAppForm();
                  },
                );
              },
              permitted:
                GlobalState.permitted(
                  PermissionComponentsEnum.Calendar,
                  true,
                ) &&
                vnode.attrs.data.recurrence !== null &&
                vnode.attrs.data.id !== null,
              primary: true,
              requireOnline: true,
            },
          ],
          data: vnode.attrs.data,
          loaded: names.length > 0,
          name: AuthAccountState.translate(ObjectEvent),
          onDelete: async (): Promise<void | Err> => {
            return CalendarEventState.delete(vnode.attrs.data.id);
          },
          onSubmit: async (): Promise<CalendarEvent | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return CalendarEventState.create(vnode.attrs.data);
            }

            return CalendarEventState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Calendar,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Calendar,
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
          vnode.attrs.data.authHouseholdID === null
            ? []
            : m(FormItemSelectAuthHouseholdMembers, {
                authHouseholdID: vnode.attrs.data.authHouseholdID,
                members: vnode.attrs.data.participants,
                multiple: true,
                name: AuthAccountState.translate(
                  WebFormOverlayCalendarEventParticipants,
                ),
                oninput: (members: string[]): void => {
                  vnode.attrs.data.participants = members;
                },
                tooltip: AuthAccountState.translate(
                  WebFormOverlayCalendarEventParticipantsTooltip,
                ),
              }),
          m(FormItem, {
            name: AuthAccountState.translate(WebGlobalDetails),
            textArea: {
              oninput: (e: string): void => {
                vnode.attrs.data.details = e;
              },
              value: vnode.attrs.data.details,
            },
            tooltip: AuthAccountState.translate(WebGlobalDetailsTooltips),
          }),
          m(FormItem, {
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.location = e;
              },
              type: "text",
              value: vnode.attrs.data.location,
            },
            name: AuthAccountState.translate(
              WebFormOverlayCalendarEventLocation,
            ),
            tooltip: AuthAccountState.translate(
              WebFormOverlayCalendarEventLocationTooltip,
            ),
          }),
          m(FormItemDuration, {
            getDuration: () => {
              return vnode.attrs.data.travelTime;
            },
            name: AuthAccountState.translate(
              WebFormOverlayCalendarEventTravelTime,
            ),
            setDuration: (duration: number) => {
              vnode.attrs.data.travelTime = duration;
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayCalendarEventTravelTimeTooltip,
            ),
          }),
          m(
            "div.FormItem",
            {
              id: "form-item-start-time",
            },
            [
              m("div.FormItem__label", [
                m(
                  "label",
                  {
                    for: "form-item-input-start",
                    id: "form-item-label-start",
                  },
                  AuthAccountState.translate(
                    WebFormOverlayCalendarEventStartTime,
                  ),
                ),
                m(Tooltip, {
                  value: AuthAccountState.translate(
                    WebFormOverlayCalendarEventStartTimeTooltip,
                  ),
                }),
              ]),
              m("div.FormItem__multi", [
                m(FormItemInput, {
                  name: "start-date",
                  oninput: (e): void => {
                    vnode.attrs.data.dateStart = e;
                  },
                  required: true,
                  type: "date",
                  value: vnode.attrs.data.dateStart,
                }),
                allDayDuration(vnode.attrs.data.duration)
                  ? []
                  : m(FormItemInput, {
                      name: "start-time",
                      oninput: (e): void => {
                        vnode.attrs.data.timeStart = e;
                      },
                      required: true,
                      type: "time",
                      value: vnode.attrs.data.timeStart,
                    }),
              ]),
            ],
          ),
          m(
            "div.FormItem",
            {
              id: "form-item-end-time",
            },
            [
              m("div.FormItem__label", [
                m(
                  "label",
                  {
                    for: "form-item-input-start",
                    id: "form-item-label-start",
                  },
                  AuthAccountState.translate(
                    WebFormOverlayCalendarEventEndTime,
                  ),
                ),
                m(Tooltip, {
                  value: AuthAccountState.translate(
                    WebFormOverlayCalendarEventEndTimeTooltip,
                  ),
                }),
              ]),
              m("div.FormItem__multi", [
                m(FormItemInput, {
                  name: "end-date",
                  oninput: (e): void => {
                    const endT = end();
                    const date = CivilDate.fromString(e);
                    endT.timestamp.setUTCFullYear(date.year);
                    endT.timestamp.setUTCMonth(date.month - 1);
                    endT.timestamp.setUTCDate(date.day);
                    vnode.attrs.data.duration = start().getDiffMinutes(endT);
                  },
                  required: true,
                  type: "date",
                  value: end().toString().split("T")[0],
                }),
                allDayDuration(vnode.attrs.data.duration)
                  ? []
                  : m(FormItemInput, {
                      name: "end-time",
                      oninput: (e): void => {
                        const endT = end();
                        const time = CivilTime.fromString(e);
                        endT.timestamp.setUTCHours(time.hour);
                        endT.timestamp.setUTCMinutes(time.minute);
                        vnode.attrs.data.duration =
                          start().getDiffMinutes(endT);
                      },
                      required: true,
                      type: "time",
                      value:
                        vnode.attrs.data.timeStart === ""
                          ? null // null for value
                          : end()
                              .toString()
                              .split("T")[1]
                              .split(":")
                              .slice(0, 2)
                              .join(":"),
                    }),
              ]),
            ],
          ),
          m(FormCheckbox, {
            name: AuthAccountState.translate(WebFormOverlayCalendarEventAllDay),
            onclick: () => {
              if (allDayDuration(vnode.attrs.data.duration)) {
                vnode.attrs.data.duration = 60;
                vnode.attrs.data.notifyOffset = 10;
                duration(60);
              } else {
                vnode.attrs.data.timeStart = "00:00";
                vnode.attrs.data.duration = 0;
                vnode.attrs.data.notifyOffset = 12 * 60;
              }
            },
            value: allDayDuration(vnode.attrs.data.duration),
          }),
          m(FormItem, {
            name: AuthAccountState.translate(WebGlobalSendReminder),
            select: {
              oninput: (e: number): void => {
                if (Translations.calendarEventReminderTimes[e].offset === 0) {
                  notifyCustom = true;
                } else {
                  notifyCustom = false;
                }
                vnode.attrs.data.notifyOffset =
                  Translations.calendarEventReminderTimes[e].offset;
              },
              options: Translations.calendarEventReminderTimes.map(
                (reminder, index) => {
                  return {
                    id: `${index}`,
                    name: reminder.name,
                  };
                },
              ),
              value: findReminderTime(vnode.attrs.data.notifyOffset),
            },
            tooltip: AuthAccountState.translate(WebGlobalSendReminderTooltip),
          }),
          notifyCustom
            ? m(FormItemDuration, {
                getDuration: () => {
                  if (vnode.attrs.data.notifyOffset === null) {
                    return 0;
                  }
                  return vnode.attrs.data.notifyOffset;
                },
                name: AuthAccountState.translate(
                  WebFormOverlayCalendarEventCustomReminder,
                ),
                setDuration: (duration: number) => {
                  vnode.attrs.data.notifyOffset = duration;
                },
                tooltip: AuthAccountState.translate(
                  WebFormOverlayCalendarEventCustomReminderTooltip,
                ),
              })
            : [],
          m(FormItemSelectColor, {
            oninput: (e) => {
              vnode.attrs.data.color = e;
            },
            value: vnode.attrs.data.color,
          }),
          m(FormItem, {
            name: AuthAccountState.translate(WebGlobalTimeZone),
            select: {
              oninput: (e: string): void => {
                vnode.attrs.data.timeZone = e;
              },
              options: names,
              value: vnode.attrs.data.timeZone,
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayCalendarEventTimeZoneTooltip,
            ),
          }),
          m(FormCheckbox, {
            name: AuthAccountState.translate(WebGlobalRecurring),
            onclick: () => {
              if (vnode.attrs.data.recurrence === null) {
                vnode.attrs.data.recurrence = Recurrence.new();
              } else {
                vnode.attrs.data.recurrence = null;
              }
            },
            value: vnode.attrs.data.recurrence !== null,
          }),
          vnode.attrs.data.recurrence === null
            ? []
            : m(FormRecurrence, {
                endDate: vnode.attrs.data.dateEnd,
                endDateInput: (e) => {
                  vnode.attrs.data.dateEnd = e;
                },
                futureNext: true,
                recurrence: vnode.attrs.data.recurrence,
                startDate: vnode.attrs.data.dateStart,
              }),
        ],
      );
    },
  };
}
