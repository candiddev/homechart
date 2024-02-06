import { Button } from "@lib/components/Button";
import { FormItemInput } from "@lib/components/FormItemInput";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import { Tooltip } from "@lib/components/Tooltip";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { Icons } from "@lib/types/Icons";
import { UUID } from "@lib/types/UUID";
import { Animate, Animation } from "@lib/utilities/Animate";
import { ActionAdd } from "@lib/yaml8n";
import m from "mithril";

import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import { HealthItemState } from "../states/HealthItem";
import type { HealthLog } from "../states/HealthLog";
import { HealthLogState } from "../states/HealthLog";
import { PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import {
  ObjectInput,
  ObjectInputs,
  ObjectLogs,
  ObjectOutput,
  ObjectOutputs,
  WebFormOverlayHealthLogDateTooltip,
  WebFormOverlayHealthLogInputsTooltip,
  WebFormOverlayHealthLogOutputsTooltip,
  WebGlobalDate,
  WebGlobalHouseholdMember,
  WebGlobalHouseholdMemberTooltip,
} from "../yaml8n";

export interface FormOverlayHealthLogs {
  /** AuthAccountID for HealthLogs. */
  authAccountID: NullUUID;

  /** Date for the HealthLogs. */
  date: NullCivilDate;

  /** ID to trigger delete button. */
  id: NullUUID;

  /** The actual logs to manage. */
  logs: HealthLog[];
}

export function FormOverlayHealthLogs(): m.Component<
  FormOverlayComponentAttrs<FormOverlayHealthLogs>
> {
  let deleteLogs: HealthLog[] = [];

  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    oninit: (vnode): void => {
      deleteLogs = [];

      if (vnode.attrs.data.logs.length === 0) {
        vnode.attrs.data.logs.push(
          ...HealthLogState.data().filter((log) => {
            return (
              log.authAccountID === vnode.attrs.data.authAccountID &&
              log.date === vnode.attrs.data.date
            );
          }),
        );
        m.redraw();
      }
    },
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data as unknown as Data,
          name: AuthAccountState.translate(ObjectLogs),
          onDelete: async (): Promise<void> => {
            for (const log of vnode.attrs.data.logs) {
              if (log.created !== null) {
                await HealthLogState.delete(log.id);
              }
            }
          },
          onSubmit: async (): Promise<void | Err> => {
            for (const log of vnode.attrs.data.logs) {
              if (log.nameInput !== undefined || log.nameOutput !== undefined) {
                await HealthItemState.create({
                  ...HealthItemState.new(),
                  ...{
                    authAccountID: vnode.attrs.data.authAccountID,
                    name:
                      log.nameInput === undefined
                        ? (log.nameOutput as string)
                        : log.nameInput,
                    output: log.nameOutput !== undefined,
                  },
                }).then((item) => {
                  if (IsErr(item)) {
                    return item;
                  }

                  log.healthItemID = item.id;
                  delete log.nameInput;

                  return;
                });
              }

              if (log.created === null) {
                await HealthLogState.create(log).catch(() => {
                  AppState.setComponentsButtonLoading("");
                });
              } else {
                await HealthLogState.update(log).catch(() => {
                  AppState.setComponentsButtonLoading("");
                });
              }
            }

            for (const log of deleteLogs) {
              if (log.created !== null) {
                await HealthLogState.delete(log.id).catch(() => {
                  AppState.setComponentsButtonLoading("");
                });
              }
            }
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Health,
            true,
            AuthAccountState.data().primaryAuthHouseholdID,
          ),
        },
        [
          AuthHouseholdState.getPermitted(
            PermissionComponentsEnum.Auth,
            PermissionEnum.Edit,
          ).length > 0 && AuthHouseholdState.membersChildren().length > 0
            ? m(FormItemSelectAuthHouseholdMembers, {
                authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
                memberNames: AuthHouseholdState.findMemberNames(null, true),
                members:
                  vnode.attrs.data.authAccountID === null
                    ? ([] as string[])
                    : [vnode.attrs.data.authAccountID],
                name: AuthAccountState.translate(WebGlobalHouseholdMember),
                oninput: (member: NullUUID): void => {
                  vnode.attrs.data.authAccountID = member;

                  vnode.attrs.data.logs = [];
                },
                tooltip: AuthAccountState.translate(
                  WebGlobalHouseholdMemberTooltip,
                ),
              })
            : undefined,
          m(FormItemInputDate, {
            name: AuthAccountState.translate(WebGlobalDate),
            oninput: (e: string): void => {
              vnode.attrs.data.date = e;

              for (let i = 0; i < vnode.attrs.data.logs.length; i++) {
                vnode.attrs.data.logs[i].date = vnode.attrs.data.date;
              }
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayHealthLogDateTooltip,
            ),
            value: vnode.attrs.data.date,
          }),
          m(
            "div.FormItem",
            {
              id: "form-item-inputs",
            },
            [
              m("div.FormItem__label", [
                m(
                  "label",
                  {
                    for: "form-item-input-inputs",
                    id: "form-item-label-inputs",
                  },
                  AuthAccountState.translate(ObjectInputs),
                ),
                m(Tooltip, {
                  value: AuthAccountState.translate(
                    WebFormOverlayHealthLogInputsTooltip,
                  ),
                }),
              ]),
              vnode.attrs.data.logs.map((log, i) => {
                const item = HealthItemState.findID(log.healthItemID);

                if (
                  (item.output && log.nameInput === undefined) ||
                  log.nameOutput !== undefined
                ) {
                  return m("p", {
                    key: `${log.id}`,
                  });
                }

                return m(
                  "div.FormItem__multi",
                  {
                    key: `${log.id}`,
                    style: {
                      "flex-wrap": "nowrap",
                    },
                  },
                  [
                    m(FormItemInput, {
                      datalist: HealthItemState.findAuthAccountID(
                        vnode.attrs.data.authAccountID,
                        false,
                      ).map((item) => {
                        return item.name;
                      }),
                      name: `inputs-${log.id}`,
                      oninput: (e: string) => {
                        const item = HealthItemState.findAuthAccountIDName(
                          vnode.attrs.data.authAccountID,
                          e,
                        );

                        if (item.id === null) {
                          log.nameInput = e;
                        } else {
                          log.healthItemID = item.id;
                          delete log.nameInput;
                        }
                      },
                      type: "text",
                      value:
                        log.nameInput === undefined
                          ? HealthItemState.findID(log.healthItemID).name
                          : log.nameInput,
                    }),
                    m(
                      "i.GlobalButtonIconAdd",
                      {
                        onclick: () => {
                          vnode.attrs.data.logs.splice(i, 1);

                          deleteLogs.push(log);
                        },
                      },
                      Icons.Delete,
                    ),
                  ],
                );
              }),
              m(Button, {
                name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectInput)}`,
                onclick: async (): Promise<void> => {
                  return new Promise((resolve) => {
                    vnode.attrs.data.logs.push({
                      ...HealthLogState.new(),
                      ...{
                        authAccountID: vnode.attrs.data.authAccountID,
                        date: vnode.attrs.data.date,
                        id: UUID.new(),
                        nameInput: "",
                      },
                    });
                    return resolve();
                  });
                },
                permitted: true,
                primary: true,
                requireOnline: true,
              }),
            ],
          ),
          m(
            "div.FormItem",
            {
              id: "form-item-outputs",
            },
            [
              m("div.FormItem__label", [
                m(
                  "label",
                  {
                    for: "form-item-input-items",
                    id: "form-item-label-items",
                  },
                  AuthAccountState.translate(ObjectOutputs),
                ),
                m(Tooltip, {
                  value: AuthAccountState.translate(
                    WebFormOverlayHealthLogOutputsTooltip,
                  ),
                }),
              ]),
              vnode.attrs.data.logs.map((log, i) => {
                const item = HealthItemState.findID(log.healthItemID);

                if (!item.output && log.nameOutput === undefined) {
                  return m("p", {
                    key: `${log.id}`,
                  });
                }

                return m(
                  "div.FormItem__multi",
                  {
                    key: `${log.id}`,
                    style: {
                      "flex-wrap": "nowrap",
                    },
                  },
                  [
                    m(FormItemInput, {
                      datalist: HealthItemState.findAuthAccountID(
                        vnode.attrs.data.authAccountID,
                        true,
                      ).map((item) => {
                        return item.name;
                      }),
                      name: `outputs-${log.id}`,
                      oninput: (e: string) => {
                        const item = HealthItemState.findAuthAccountIDName(
                          vnode.attrs.data.authAccountID,
                          e,
                        );

                        if (item.id === null) {
                          log.nameOutput = e;
                        } else {
                          log.healthItemID = item.id;
                          delete log.nameOutput;
                        }
                      },
                      type: "text",
                      value:
                        log.nameOutput === undefined
                          ? HealthItemState.findID(log.healthItemID).name
                          : log.nameOutput,
                    }),
                    m(
                      "i.GlobalButtonIconAdd",
                      {
                        onclick: () => {
                          vnode.attrs.data.logs.splice(i, 1);

                          deleteLogs.push(log);
                        },
                      },
                      Icons.Delete,
                    ),
                  ],
                );
              }),
              m(Button, {
                name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectOutput)}`,
                onclick: async (): Promise<void> => {
                  return new Promise((resolve) => {
                    vnode.attrs.data.logs.push({
                      ...HealthLogState.new(),
                      ...{
                        authAccountID: vnode.attrs.data.authAccountID,
                        date: vnode.attrs.data.date,
                        id: UUID.new(),
                        nameOutput: "",
                      },
                    });
                    return resolve();
                  });
                },
                permitted: true,
                requireOnline: true,
              }),
            ],
          ),
        ],
      );
    },
  };
}
