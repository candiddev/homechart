import "./CookRecipesID.css";

import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormImage } from "@lib/components/FormImage";
import { FormItem } from "@lib/components/FormItem";
import { FormItemDuration } from "@lib/components/FormItemDuration";
import { FormItemIcons } from "@lib/components/FormItemIcons";
import { Title } from "@lib/components/Title";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import {
  ActionAdd,
  ActionCancel,
  ActionDelete,
  ActionEdit,
  ActionNew,
} from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormImportRecipe } from "../components/FormImportRecipe";
import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { FormOverlayCookMealPlan } from "../components/FormOverlayCookMealPlan";
import { FormShopItemIngredients } from "../components/FormShopItemIngredients";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { apiEndpoint } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthSessionState } from "../states/AuthSession";
import type { CookMealPlan } from "../states/CookMealPlan";
import { CookMealPlanState } from "../states/CookMealPlan";
import type { CookRecipe } from "../states/CookRecipe";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import {
  Permission,
  PermissionComponentsEnum,
  PermissionEnum,
} from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectCook,
  ObjectNote,
  ObjectNotes,
  ObjectRecipe,
  ObjectRecipeNote,
  ObjectRecipes,
  WebCookRecipesIDCookTime,
  WebCookRecipesIDCookTimeTooltip,
  WebCookRecipesIDCopyRecipe,
  WebCookRecipesIDDirections,
  WebCookRecipesIDDirectionsTooltip,
  WebCookRecipesIDIngredientsToShoppingList,
  WebCookRecipesIDNewRecipeName,
  WebCookRecipesIDNoteTooltip,
  WebCookRecipesIDPrepTime,
  WebCookRecipesIDPrepTimeTooltip,
  WebCookRecipesIDPublic,
  WebCookRecipesIDServingsTooltip,
  WebCookRecipesIDSource,
  WebCookRecipesIDSourceTooltip,
  WebGlobalActionDeleteNow,
  WebGlobalActionImportRecipeFromWebsite,
  WebGlobalActionRestore,
  WebGlobalActionSave,
  WebGlobalDeleted,
  WebGlobalImage,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalNever,
  WebGlobalRecipeComplexity,
  WebGlobalRecipeComplexityTooltip,
  WebGlobalRecipeIngredients,
  WebGlobalRecipeIngredientsTooltip,
  WebGlobalRecipeLastMade,
  WebGlobalRecipeRating,
  WebGlobalRecipeRatingTooltip,
  WebGlobalRecipeScale,
  WebGlobalRecipeScaleTooltip,
  WebGlobalRecipeServings,
  WebGlobalRecipeTimesMade,
  WebGlobalTags,
  WebGlobalTagsTooltip,
  WebGlobalURL,
} from "../yaml8n";

enum visible {
  None,
  ImportURL,
  ShopItemIngredients,
}

export function CookRecipesID(): m.Component {
  const state: {
    cookMealPlan: CookMealPlan;
    cookRecipe: CookRecipe;
    edit: Stream<boolean>;
    editLog: NullCivilDate;
    formVisible: visible;
    id: Stream<string>;
    lift: Stream<Promise<void>>;
    loaded: boolean;
    scale: string;
  } = {
    cookMealPlan: CookMealPlanState.new(),
    cookRecipe: CookRecipeState.new(),
    edit: Stream(false as boolean),
    editLog: null,
    formVisible: visible.None,
    id: Stream(""),
    lift: Stream(),
    loaded: false,
    scale: "1",
  };

  function setBreadcrumbs(): void {
    AppState.setLayoutApp({
      ...GetHelp("cook"),
      breadcrumbs: [
        {
          link: AppState.isSessionAuthenticated() ? "/cook/recipes" : "/signin",
          name: AuthAccountState.translate(ObjectCook),
        },
        {
          link: AppState.isSessionAuthenticated() ? "/cook/recipes" : "/signin",
          name: AuthAccountState.translate(ObjectRecipes),
        },
        ...(state.loaded
          ? [
              {
                name:
                  state.cookRecipe.name === ""
                    ? AuthAccountState.translate(ActionNew)
                    : state.cookRecipe.name,
              },
            ]
          : []),
      ],
      toolbarActionButtons: [
        {
          icon: Icons.ShopItem,
          name: AuthAccountState.translate(
            WebCookRecipesIDIngredientsToShoppingList,
          ),
          onclick: (): void => {
            state.formVisible = visible.ShopItemIngredients;
          },
          permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true),
          requireOnline: true,
        },
        {
          ...AppToolbarActions().newCookMealPlan,
          ...{
            onclick: (): void => {
              AppState.setLayoutAppForm(FormOverlayCookMealPlan, {
                ...CookMealPlanState.new(),
                ...{
                  cookRecipeID: state.cookRecipe.id,
                },
              });
            },
          },
        },
        AppToolbarActions().newCookRecipe,
        {
          icon: Icons.Template,
          name: AuthAccountState.translate(WebCookRecipesIDCopyRecipe),
          onclick: async (): Promise<void> => {
            return new Promise((resolve) => {
              state.edit(true);
              m.route.set(
                `/cook/recipes/${state.cookRecipe.id}?copy&edit`,
                {},
                {
                  state: {
                    key: Date.now(),
                  },
                },
              );

              return resolve();
            });
          },
          permitted:
            GlobalState.permitted(PermissionComponentsEnum.Cook, true) &&
            m.route.param().id !== "new",
          requireOnline: true,
        },
        {
          icon: Icons.ImportExport,
          name: AuthAccountState.translate(
            WebGlobalActionImportRecipeFromWebsite,
          ),
          onclick: (): void => {
            state.formVisible = visible.ImportURL;
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Cook,
            true,
            state.cookRecipe.authHouseholdID,
          ),
          requireOnline: true,
        },
      ],
    });
  }

  return {
    oninit: (): void => {
      state.lift = Stream.lift(
        async (_cookRecipeState, edit, id) => {
          if (state.cookRecipe.id === null || !edit) {
            state.cookRecipe = Clone(CookRecipeState.findID(id));

            if (state.cookRecipe.id === null && id !== "") {
              await CookRecipeState.read(id, undefined, true).then(
                async (recipe) => {
                  if (recipe !== undefined && !IsErr(recipe)) {
                    CookRecipeState.set(recipe);

                    state.cookRecipe = recipe;
                    state.loaded = true;

                    return;
                  }
                },
              );
            } else {
              state.cookMealPlan = {
                ...state.cookMealPlan,
                ...{
                  cookRecipeID: state.cookRecipe.id,
                  cookRecipeScale: state.scale,
                },
              };

              if (m.route.param().copy !== undefined) {
                state.cookRecipe.id = null;
              }

              state.loaded = true;
            }

            m.redraw();
          }

          setBreadcrumbs();
        },
        CookRecipeState.data,
        state.edit,
        state.id,
      );

      state.loaded = false;

      Telemetry.spanStart("CookRecipesID");

      if (m.route.param().edit !== undefined) {
        state.edit(true);
      }

      if (
        m.route.param().scale !== undefined &&
        m.route.param().scale !== "0"
      ) {
        state.scale = m.route.param().scale;
      }

      const id = m.route.param().id;
      if (id === "new") {
        state.cookRecipe = CookRecipeState.new();
        state.cookRecipe.name = AuthAccountState.translate(
          WebCookRecipesIDNewRecipeName,
        );
        state.cookRecipe.tags = [];
        state.cookRecipe.timeCook = 15;
        state.cookRecipe.timePrep = 15;
        state.cookRecipe.notes = [
          {
            complexity: 0,
            date: CivilDate.now().toJSON(),
            note: AuthAccountState.translate(ObjectRecipeNote),
            rating: 0,
          },
        ];
        state.editLog = state.cookRecipe.notes[0].date;

        setBreadcrumbs();
      } else {
        state.id(id);
      }

      Telemetry.spanEnd("CookRecipesID");
    },
    onremove: (): void => {
      state.lift.end(true);
    },
    view: (): m.Children => {
      return [
        AppState.isSessionAuthenticated() &&
        Permission.isPermitted(
          AuthSessionState.data().permissionsHouseholds,
          PermissionComponentsEnum.Cook,
          PermissionEnum.View,
          state.cookRecipe.authHouseholdID,
        )
          ? [
              m(FormImportRecipe, {
                toggle: (v) => {
                  state.formVisible = v ? visible.ImportURL : visible.None;
                },
                visible: state.formVisible === visible.ImportURL,
              }),
              m(FormShopItemIngredients, {
                cookMealPlans: [state.cookMealPlan],
                toggle: (v): void => {
                  state.formVisible = v
                    ? visible.ShopItemIngredients
                    : visible.None;
                },
                visible: state.formVisible === visible.ShopItemIngredients,
              }),
            ]
          : [],
        m(
          Form,
          {
            classes: ["CookRecipesID__form"],
            lastModified: state.cookRecipe.updated,
            loaded: state.loaded,
            title: {
              buttonLeft: {
                icon: state.edit()
                  ? Icons.Cancel
                  : state.cookRecipe.deleted === null
                    ? Icons.Delete
                    : Icons.DeleteForever,
                name: state.edit()
                  ? AuthAccountState.translate(ActionCancel)
                  : state.cookRecipe.deleted === null
                    ? AuthAccountState.translate(ActionDelete)
                    : AuthAccountState.translate(WebGlobalActionDeleteNow),
                onclick: async (): Promise<void> => {
                  if (state.edit()) {
                    state.edit(false);

                    if (m.route.param().id === "new") {
                      m.route.set("/cook/recipes");
                    } else {
                      m.route.set(`/cook/recipes/${m.route.param().id}`);
                    }

                    return;
                  } else if (state.cookRecipe.deleted === null) {
                    const recipe = CookRecipeState.findID(m.route.param().id);
                    recipe.deleted = Timestamp.now().toString();
                    return CookRecipeState.update(recipe).then(() => {
                      m.route.set("/cook/recipes");
                    });
                  }
                  return CookRecipeState.delete(m.route.param().id).then(() => {
                    m.route.set("/cook/recipes");
                  });
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Cook,
                  true,
                  state.cookRecipe.authHouseholdID,
                ),
                requireOnline: true,
              },
              buttonRight: {
                icon:
                  state.cookRecipe.deleted === null
                    ? state.edit()
                      ? Icons.Save
                      : Icons.Edit
                    : Icons.Restore,
                name:
                  state.cookRecipe.deleted === null
                    ? state.edit()
                      ? AuthAccountState.translate(WebGlobalActionSave)
                      : AuthAccountState.translate(ActionEdit)
                    : AuthAccountState.translate(WebGlobalActionRestore),
                onclick: async (): Promise<void | Err> => {
                  if (state.cookRecipe.deleted !== null) {
                    state.cookRecipe.deleted = null;
                    return CookRecipeState.update(state.cookRecipe).then(() => {
                      state.cookRecipe = CookRecipeState.findID(
                        state.cookRecipe.id,
                      );
                    });
                  } else if (state.edit()) {
                    if (state.cookRecipe.id === null) {
                      return CookRecipeState.create(state.cookRecipe).then(
                        (recipe) => {
                          if (IsErr(recipe)) {
                            return recipe;
                          }

                          m.route.set(
                            `/cook/recipes/${recipe.id}`,
                            {},
                            {
                              state: {
                                key: Date.now(),
                              },
                            },
                          );

                          return;
                        },
                      );
                    }

                    return CookRecipeState.update(state.cookRecipe).then(() => {
                      m.route.set(
                        `/cook/recipes/${m.route.param().id}`,
                        {},
                        {
                          state: {
                            key: Date.now(),
                          },
                        },
                      );
                    });
                  }
                  state.edit(true);
                  m.route.set(
                    `/cook/recipes/${state.cookRecipe.id}?edit`,
                    {},
                    {
                      state: {
                        key: Date.now(),
                      },
                    },
                  );
                },
                permitted:
                  state.cookRecipe.id === null ||
                  GlobalState.permitted(
                    PermissionComponentsEnum.Cook,
                    true,
                    state.cookRecipe.authHouseholdID,
                  ),
                requireOnline: true,
              },
              name: state.loaded ? state.cookRecipe.name : "",
            },
            wrap: true,
          },
          [
            m(FormImage, {
              disabled: !state.edit(),
              name: AuthAccountState.translate(WebGlobalImage),
              oninput: (image: string) => {
                state.cookRecipe.image = image;
              },
              value: state.cookRecipe.image,
            }),
            m("div.CookRecipesID__heading", [
              state.edit()
                ? m(FormItem, {
                    input: {
                      oninput: (e: string): void => {
                        state.cookRecipe.name = e;
                      },
                      type: "text",
                      value: state.cookRecipe.name,
                    },
                    name: AuthAccountState.translate(WebGlobalName),
                    tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
                  })
                : [],
              state.edit()
                ? m(FormItemSelectAuthHousehold, {
                    item: state.cookRecipe,
                    permissionComponent: PermissionComponentsEnum.Cook,
                  })
                : [],
              m(FormItemDuration, {
                disabled: !state.edit(),
                getDuration: (): number => {
                  return state.cookRecipe.timePrep;
                },
                name: AuthAccountState.translate(WebCookRecipesIDPrepTime),
                setDuration: (duration: number): void => {
                  state.cookRecipe.timePrep = duration;
                },
                tooltip: AuthAccountState.translate(
                  WebCookRecipesIDPrepTimeTooltip,
                ),
              }),
              m(FormItemDuration, {
                disabled: !state.edit(),
                getDuration: (): number => {
                  return state.cookRecipe.timeCook;
                },
                name: AuthAccountState.translate(WebCookRecipesIDCookTime),
                setDuration: (duration: number): void => {
                  state.cookRecipe.timeCook = duration;
                },
                tooltip: AuthAccountState.translate(
                  WebCookRecipesIDCookTimeTooltip,
                ),
              }),
              m(FormItem, {
                input: {
                  datalist: CookRecipeState.tagNames(),
                  disabled: !state.edit(),
                  icon: Icons.Tag,
                  type: "text",
                  value: state.cookRecipe.tags,
                  valueLinkPrefix: "/cook/recipes?tag=",
                },
                name: AuthAccountState.translate(WebGlobalTags),
                tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
              }),
              m(FormItem, {
                input: {
                  disabled: !state.edit(),
                  oninput: (e: string): void => {
                    state.cookRecipe.source = e;
                  },
                  type: "text",
                  value: state.cookRecipe.source,
                },
                name: AuthAccountState.translate(WebCookRecipesIDSource),
                tooltip: AuthAccountState.translate(
                  WebCookRecipesIDSourceTooltip,
                ),
              }),
              state.cookRecipe.deleted === null
                ? []
                : m(FormItem, {
                    input: {
                      disabled: true,
                      oninput: (): void => {},
                      type: "text",
                      value: Timestamp.fromString(state.cookRecipe.deleted)
                        .toCivilDate()
                        .toString(
                          AuthAccountState.data().preferences.formatDateOrder,
                          AuthAccountState.data().preferences
                            .formatDateSeparator,
                        ),
                    },
                    name: AuthAccountState.translate(WebGlobalDeleted),
                    tooltip: "",
                  }),
            ]),
            state.edit()
              ? []
              : m(FormItemIcons, {
                  disabled: true,
                  iconSelect: Icons.RatingSelect,
                  iconUnselect: Icons.RatingUnselect,
                  max: 5,
                  name: AuthAccountState.translate(WebGlobalRecipeComplexity),
                  tooltip: AuthAccountState.translate(
                    WebGlobalRecipeComplexityTooltip,
                  ),
                  value: state.cookRecipe.complexity,
                }),
            state.edit()
              ? []
              : m(FormItemIcons, {
                  disabled: true,
                  iconSelect: Icons.RatingSelect,
                  iconUnselect: Icons.RatingUnselect,
                  max: 5,
                  name: AuthAccountState.translate(WebGlobalRecipeRating),
                  tooltip: AuthAccountState.translate(
                    WebGlobalRecipeRatingTooltip,
                  ),
                  value: state.cookRecipe.rating,
                }),
            m(FormItem, {
              input: {
                disabled: !state.edit(),
                oninput: (e: string): void => {
                  state.cookRecipe.servings = e;
                },
                type: "text",
                value: CookRecipeState.scaleIngredient(
                  state.cookRecipe.servings,
                  state.scale,
                ),
              },
              name: AuthAccountState.translate(WebGlobalRecipeServings),
              tooltip: AuthAccountState.translate(
                WebCookRecipesIDServingsTooltip,
              ),
            }),
            state.edit()
              ? m(FormCheckbox, {
                  name: AuthAccountState.translate(WebCookRecipesIDPublic),
                  onclick: () => {
                    state.cookRecipe.public = !state.cookRecipe.public;
                  },
                  value: state.cookRecipe.public,
                })
              : m(FormItem, {
                  input: {
                    oninput: (e: string): void => {
                      state.scale = e;
                    },
                    onremove: (): void => {
                      state.scale = "1";
                      m.redraw();
                    },
                    type: "text",
                    value: state.scale,
                  },
                  name: AuthAccountState.translate(WebGlobalRecipeScale),
                  tooltip: AuthAccountState.translate(
                    WebGlobalRecipeScaleTooltip,
                  ),
                }),
            m(FormItem, {
              autocompleteOptions: [
                `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectRecipe)}`,
              ],
              name: AuthAccountState.translate(WebGlobalRecipeIngredients),
              textArea: {
                clickable: true,
                disabled: !state.edit(),
                oninput: (e: string): void => {
                  state.cookRecipe.ingredients = e;
                },
                value: state.edit()
                  ? state.cookRecipe.ingredients
                  : CookRecipeState.scaleIngredients(
                      state.cookRecipe.ingredients,
                      state.scale,
                    ),
              },
              tooltip: AuthAccountState.translate(
                WebGlobalRecipeIngredientsTooltip,
              ),
            }),
            m(FormItem, {
              autocompleteOptions: [
                `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectRecipe)}`,
              ],
              name: AuthAccountState.translate(WebCookRecipesIDDirections),
              textArea: {
                clickable: true,
                disabled: !state.edit(),
                oninput: (e: string): void => {
                  state.cookRecipe.directions = e;
                },
                value: state.cookRecipe.directions,
              },
              tooltip: AuthAccountState.translate(
                WebCookRecipesIDDirectionsTooltip,
              ),
            }),
            AppState.isSessionAuthenticated()
              ? [
                  m(FormItem, {
                    input: {
                      disabled: !state.edit(),
                      oninput: (e: string): void => {
                        const i = parseInt(e);

                        if (!isNaN(i)) {
                          state.cookRecipe.cookMealPlanCount = i;
                        }
                      },
                      type: "number",
                      value: state.cookRecipe.cookMealPlanCount,
                    },
                    name: AuthAccountState.translate(WebGlobalRecipeTimesMade),
                    tooltip:
                      "Manually adjust the number of times the recipe has been made",
                  }),
                  m(FormItem, {
                    input: {
                      disabled: !state.edit(),
                      oninput: (e: string): void => {
                        state.cookRecipe.cookMealPlanLast = e;
                      },
                      type: state.edit() ? "date" : "text",
                      value: state.edit()
                        ? state.cookRecipe.cookMealPlanLast
                        : state.cookRecipe.cookMealPlanLast === null
                          ? AuthAccountState.translate(WebGlobalNever)
                          : CivilDate.fromString(
                              state.cookRecipe.cookMealPlanLast,
                            ).toString(
                              AuthAccountState.data().preferences
                                .formatDateOrder,
                              AuthAccountState.data().preferences
                                .formatDateSeparator,
                            ),
                    },
                    name: AuthAccountState.translate(WebGlobalRecipeLastMade),
                    tooltip: "",
                  }),
                ]
              : [],
            state.cookRecipe.public
              ? m(FormItem, {
                  input: {
                    disabled: true,
                    markdown: true,
                    oninput: () => {},
                    type: "text",
                    value: `${
                      apiEndpoint().hostname === ""
                        ? window.location.origin
                        : apiEndpoint().hostname
                    }${window.location.pathname}`,
                  },
                  name: `${AuthAccountState.translate(WebCookRecipesIDPublic)} ${AuthAccountState.translate(WebGlobalURL)}`,
                  tooltip: "",
                })
              : [],
            m("div.CookRecipesID__notes#notes", [
              m("div", [
                m("p", AuthAccountState.translate(ObjectNotes)),
                m(Button, {
                  icon: Icons.Add,
                  name: AuthAccountState.translate(ActionAdd),
                  onclick: async (): Promise<void> => {
                    return new Promise((resolve) => {
                      const now = CivilDate.now();
                      const index = state.cookRecipe.notes.findIndex((log) => {
                        return log.date === now.toJSON();
                      });

                      if (index < 0) {
                        state.cookRecipe.notes.unshift({
                          ...CookRecipeState.newLog(),
                          ...{
                            date: now.toJSON(),
                          },
                        });

                        state.editLog = now.toJSON();
                      } else {
                        state.editLog = state.cookRecipe.notes[index].date;
                      }

                      m.redraw();

                      return resolve();
                    });
                  },
                  permitted:
                    GlobalState.permitted(
                      PermissionComponentsEnum.Cook,
                      true,
                    ) && state.cookRecipe.id !== null,
                  requireOnline: true,
                }),
              ]),
              m("div", [
                state.cookRecipe.notes !== undefined &&
                state.cookRecipe.notes !== null
                  ? state.cookRecipe.notes.map((_note, index) => {
                      return m("div", [
                        m(Title, {
                          buttonLeft: {
                            icon:
                              state.editLog ===
                              state.cookRecipe.notes[index].date
                                ? Icons.Cancel
                                : Icons.Delete,
                            name:
                              state.editLog ===
                              state.cookRecipe.notes[index].date
                                ? AuthAccountState.translate(ActionCancel)
                                : AuthAccountState.translate(ActionDelete),
                            onclick: async (): Promise<void> => {
                              if (
                                state.editLog ===
                                state.cookRecipe.notes[index].date
                              ) {
                                state.editLog = null;
                                return;
                              }

                              state.cookRecipe.notes.splice(index, 1);
                              return CookRecipeState.update(
                                state.cookRecipe,
                              ).then(() => {
                                state.editLog = null;
                                state.cookRecipe = CookRecipeState.findID(
                                  state.cookRecipe.id,
                                );
                              });
                            },
                            permitted:
                              GlobalState.permitted(
                                PermissionComponentsEnum.Cook,
                                true,
                              ) && state.cookRecipe.id !== null,
                            requireOnline: true,
                          },
                          buttonRight: {
                            icon:
                              state.editLog ===
                              state.cookRecipe.notes[index].date
                                ? Icons.Save
                                : Icons.Edit,
                            name:
                              state.editLog ===
                              state.cookRecipe.notes[index].date
                                ? AuthAccountState.translate(
                                    WebGlobalActionSave,
                                  )
                                : AuthAccountState.translate(ActionEdit),
                            onclick: async () => {
                              if (
                                state.editLog ===
                                state.cookRecipe.notes[index].date
                              ) {
                                return CookRecipeState.update(
                                  state.cookRecipe,
                                ).then(() => {
                                  state.editLog = null;
                                  state.cookRecipe = CookRecipeState.findID(
                                    state.cookRecipe.id,
                                  );
                                });
                              }

                              state.editLog =
                                state.cookRecipe.notes[index].date;
                            },
                            permitted:
                              GlobalState.permitted(
                                PermissionComponentsEnum.Cook,
                                true,
                              ) && state.cookRecipe.id !== null,
                            requireOnline: true,
                          },
                          name: CivilDate.fromString(
                            state.cookRecipe.notes[index].date!,
                          ) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                            .toString(
                              AuthAccountState.data().preferences
                                .formatDateOrder,
                              AuthAccountState.data().preferences
                                .formatDateSeparator,
                            ),
                        }),
                        m("div.CookRecipesID__wrap", [
                          m("div.CookRecipesID__wrap", [
                            m(FormItemIcons, {
                              disabled:
                                state.editLog !==
                                state.cookRecipe.notes[index].date,
                              iconSelect: Icons.RatingSelect,
                              iconUnselect: Icons.RatingUnselect,
                              idPostfix: `${index}`,
                              max: 5,
                              name: AuthAccountState.translate(
                                WebGlobalRecipeComplexity,
                              ),
                              onclick: (e: number) => {
                                state.cookRecipe.notes[index].complexity = e;
                              },
                              tooltip: AuthAccountState.translate(
                                WebGlobalRecipeComplexityTooltip,
                              ),
                              value: state.cookRecipe.notes[index].complexity,
                            }),
                            m(FormItemIcons, {
                              disabled:
                                state.editLog !==
                                state.cookRecipe.notes[index].date,
                              iconSelect: Icons.RatingSelect,
                              iconUnselect: Icons.RatingUnselect,
                              idPostfix: `${index}`,
                              max: 5,
                              name: AuthAccountState.translate(
                                WebGlobalRecipeRating,
                              ),
                              onclick: (e: number) => {
                                state.cookRecipe.notes[index].rating = e;
                              },
                              tooltip: AuthAccountState.translate(
                                WebGlobalRecipeRatingTooltip,
                              ),
                              value: state.cookRecipe.notes[index].rating,
                            }),
                          ]),
                          m("div.CookRecipesID__wrap", [
                            m(FormItem, {
                              name: AuthAccountState.translate(ObjectNote),
                              textArea: {
                                disabled:
                                  state.editLog !==
                                  state.cookRecipe.notes[index].date,
                                oninput: (e) => {
                                  state.cookRecipe.notes[index].note = e;
                                },
                                value: state.cookRecipe.notes[index].note,
                              },
                              tooltip: AuthAccountState.translate(
                                WebCookRecipesIDNoteTooltip,
                              ),
                            }),
                          ]),
                        ]),
                      ]);
                    })
                  : [],
              ]),
            ]),
          ],
        ),
      ];
    },
  };
}
