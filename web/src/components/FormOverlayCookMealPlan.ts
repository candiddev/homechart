import { Button } from "@lib/components/Button";
import { FormExpander } from "@lib/components/FormExpander";
import { FormImage } from "@lib/components/FormImage";
import { FormItem } from "@lib/components/FormItem";
import { FormItemIcons } from "@lib/components/FormItemIcons";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import type { CookMealPlan } from "../states/CookMealPlan";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectMeal,
  ObjectMealPlan,
  ObjectMealTime,
  ObjectRecipe,
  WebFormOverlayCookMealPlanChef,
  WebFormOverlayCookMealPlanChefTooltip,
  WebFormOverlayCookMealPlanDateTooltip,
  WebFormOverlayCookMealPlanFilterTags,
  WebFormOverlayCookMealPlanFilterTagsTooltip,
  WebFormOverlayCookMealPlanMealTooltip,
  WebFormOverlayCookMealPlanRecipeDetails,
  WebFormOverlayCookMealPlanRecipeTooltip,
  WebFormOverlayCookMealPlanReminderCook,
  WebFormOverlayCookMealPlanReminderPrep,
  WebFormOverlayCookMealPlanReminderTooltip,
  WebFormOverlayCookMealPlanSurpriseMe,
  WebFormOverlayCookMealPlanTimeTooltip,
  WebGlobalDate,
  WebGlobalImage,
  WebGlobalRecipeIngredients,
  WebGlobalRecipeIngredientsTooltip,
  WebGlobalRecipeRating,
  WebGlobalRecipeRatingTooltip,
  WebGlobalRecipeScale,
  WebGlobalRecipeScaleTooltip,
} from "../yaml8n";

function calculateCookPrep(cookMealPlan: CookMealPlan): void {
  if (
    cookMealPlan.cookRecipeID !== null &&
    cookMealPlan.date !== null &&
    cookMealPlan.time !== null
  ) {
    const cookRecipe = CookRecipeState.findID(cookMealPlan.cookRecipeID);
    const startTime = Timestamp.fromCivilDate(
      CivilDate.fromString(cookMealPlan.date),
    );

    startTime.timestamp.setHours(parseInt(cookMealPlan.time.split(":")[0], 10));
    startTime.timestamp.setMinutes(
      parseInt(cookMealPlan.time.split(":")[1], 10),
    );

    if (cookRecipe.timeCook !== 0) {
      startTime.addMinutes(cookRecipe.timeCook * -1);
      cookMealPlan.notificationTimeCook = startTime.toString();
    }

    if (cookRecipe.timePrep !== 0) {
      startTime.addMinutes(cookRecipe.timePrep * -1);
      cookMealPlan.notificationTimePrep = startTime.toString();
      cookMealPlan.notificationTimePrep;
    }
  }
}

export function FormOverlayCookMealPlan(): m.Component<
  FormOverlayComponentAttrs<CookMealPlan>
> {
  let showRecipe = true;

  const tags: string[] = [];

  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectMealPlan),
          onDelete: async (): Promise<void | Err> => {
            if (vnode.attrs.data.id !== null) {
              return CookMealPlanState.delete(vnode.attrs.data.id);
            }
          },
          onSubmit: async (): Promise<CookMealPlan | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return CookMealPlanState.create(vnode.attrs.data);
            }

            return CookMealPlanState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Cook,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            noPersonal: true,
            permissionComponent: PermissionComponentsEnum.Cook,
          }),
          m(FormItemInputDate, {
            name: AuthAccountState.translate(WebGlobalDate),
            oninput: (e: string): void => {
              vnode.attrs.data.date = e;
              calculateCookPrep(vnode.attrs.data);
            },
            required: true,
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealPlanDateTooltip,
            ),
            value: vnode.attrs.data.date,
          }),
          m(FormItem, {
            buttonArray: {
              onclick: (e: string): void => {
                const meal = CookMealTimeState.findName(e);

                if (meal.name !== "" && meal.time !== "") {
                  vnode.attrs.data.cookMealTimeID = meal.id;
                  vnode.attrs.data.time = CookMealTimeState.findName(e).time;
                  calculateCookPrep(vnode.attrs.data);
                }
              },
              required: true,
              selected: () => {
                return [
                  vnode.attrs.data.cookMealTimeID === null
                    ? ""
                    : CookMealTimeState.findID(vnode.attrs.data.cookMealTimeID)
                        .name,
                ];
              },
              value: CookMealTimeState.names(),
            },
            name: AuthAccountState.translate(ObjectMeal),
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealPlanMealTooltip,
            ),
          }),
          m(FormItem, {
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.time = e;
                calculateCookPrep(vnode.attrs.data);
              },
              required: true,
              type: "time",
              value: vnode.attrs.data.time,
            },
            name: AuthAccountState.translate(ObjectMealTime),
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealPlanTimeTooltip,
            ),
          }),
          m(FormItemSelectAuthHouseholdMembers, {
            authHouseholdID: vnode.attrs.data.authHouseholdID,
            members: [`${vnode.attrs.data.authAccountID}`],
            name: AuthAccountState.translate(WebFormOverlayCookMealPlanChef),
            oninput: (member: string): void => {
              vnode.attrs.data.authAccountID = member;
            },
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealPlanChefTooltip,
            ),
          }),
          m(FormItem, {
            input: {
              datalist: CookRecipeState.names(),
              oninput: (e: string): void => {
                const recipe = CookRecipeState.findName(e);
                if (recipe.id === null) {
                  vnode.attrs.data.cookRecipeID = null;
                  vnode.attrs.data.customRecipe = e;
                } else {
                  vnode.attrs.data.customRecipe = "";
                  vnode.attrs.data.cookRecipeID = recipe.id;
                  calculateCookPrep(vnode.attrs.data);
                }
              },
              required: true,
              type: "text",
              value:
                vnode.attrs.data.cookRecipeID === null
                  ? vnode.attrs.data.customRecipe
                  : CookRecipeState.findID(vnode.attrs.data.cookRecipeID).name,
            },
            name: AuthAccountState.translate(ObjectRecipe),
            tooltip: AuthAccountState.translate(
              WebFormOverlayCookMealPlanRecipeTooltip,
            ),
          }),
          m(Button, {
            name: AuthAccountState.translate(
              WebFormOverlayCookMealPlanSurpriseMe,
            ),
            onclick: async (): Promise<void> => {
              return new Promise((resolve) => {
                vnode.attrs.data.cookRecipeID =
                  CookRecipeState.data()[
                    Math.floor(Math.random() * CookRecipeState.data().length)
                  ].id;

                while (
                  tags.length !== 0 &&
                  CookRecipeState.findID(
                    vnode.attrs.data.cookRecipeID,
                  ).tags.findIndex((tag) => {
                    return tags.includes(tag);
                  }) < 0
                ) {
                  vnode.attrs.data.cookRecipeID =
                    CookRecipeState.data()[
                      Math.floor(Math.random() * CookRecipeState.data().length)
                    ].id;
                }

                return resolve();
              });
            },
            permitted: CookRecipeState.data().length > 0,
            requireOnline: true,
          }),
          vnode.attrs.data.cookRecipeID === null
            ? []
            : [
                m(FormItem, {
                  input: {
                    datalist: CookRecipeState.tagNames(),
                    onlyDatalist: true,
                    type: "text",
                    value: tags,
                  },
                  name: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanFilterTags,
                  ),
                  tooltip: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanFilterTagsTooltip,
                  ),
                }),
                m(FormExpander, {
                  expand: showRecipe,
                  name: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanRecipeDetails,
                  ),
                  onclick: () => {
                    showRecipe = !showRecipe;
                  },
                }),
                showRecipe
                  ? [
                      m(FormImage, {
                        disabled: true,
                        name: AuthAccountState.translate(WebGlobalImage),
                        oninput: () => {},
                        value: CookRecipeState.findID(
                          vnode.attrs.data.cookRecipeID,
                        ).image,
                      }),
                      m(FormItemIcons, {
                        disabled: true,
                        iconSelect: Icons.RatingSelect,
                        iconUnselect: Icons.RatingUnselect,
                        max: 5,
                        name: AuthAccountState.translate(WebGlobalRecipeRating),
                        tooltip: AuthAccountState.translate(
                          WebGlobalRecipeRatingTooltip,
                        ),
                        value: CookRecipeState.findID(
                          vnode.attrs.data.cookRecipeID,
                        ).rating,
                      }),
                      m(FormItem, {
                        name: AuthAccountState.translate(
                          WebGlobalRecipeIngredients,
                        ),
                        textArea: {
                          disabled: true,
                          oninput: (): void => {},
                          value: CookRecipeState.scaleIngredients(
                            CookRecipeState.findID(
                              vnode.attrs.data.cookRecipeID,
                            ).ingredients,
                            vnode.attrs.data.cookRecipeScale,
                          ),
                        },
                        tooltip: AuthAccountState.translate(
                          WebGlobalRecipeIngredientsTooltip,
                        ),
                      }),
                      m(FormItem, {
                        input: {
                          oninput: (e: string): void => {
                            vnode.attrs.data.cookRecipeScale = e;
                          },
                          type: "text",
                          value:
                            vnode.attrs.data.cookRecipeScale !== undefined &&
                            vnode.attrs.data.cookRecipeScale !== null
                              ? vnode.attrs.data.cookRecipeScale
                              : "1",
                        },
                        name: AuthAccountState.translate(WebGlobalRecipeScale),
                        tooltip: AuthAccountState.translate(
                          WebGlobalRecipeScaleTooltip,
                        ),
                      }),
                    ]
                  : [],
              ],
          vnode.attrs.data.cookRecipeID === null
            ? []
            : [
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      if (e === "") {
                        vnode.attrs.data.notificationTimePrep = null;

                        return;
                      }

                      const date = new Date(e);

                      vnode.attrs.data.notificationTimePrep =
                        date.toISOString();
                    },
                    type: "datetime-local",
                    value:
                      vnode.attrs.data.notificationTimePrep === null
                        ? null // null for value
                        : Timestamp.fromString(
                            vnode.attrs.data.notificationTimePrep,
                          ).toHTMLDate(),
                  },
                  name: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanReminderPrep,
                  ),
                  tooltip: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanReminderTooltip,
                  ),
                }),
                m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      if (e === "") {
                        vnode.attrs.data.notificationTimeCook = null;

                        return;
                      }

                      const date = new Date(e);

                      vnode.attrs.data.notificationTimeCook =
                        date.toISOString();
                    },
                    type: "datetime-local",
                    value:
                      vnode.attrs.data.notificationTimeCook === null
                        ? null // null for value
                        : Timestamp.fromString(
                            vnode.attrs.data.notificationTimeCook,
                          ).toHTMLDate(),
                  },
                  name: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanReminderCook,
                  ),
                  tooltip: AuthAccountState.translate(
                    WebFormOverlayCookMealPlanReminderTooltip,
                  ),
                }),
              ],
        ],
      );
    },
  };
}
