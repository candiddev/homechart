import "./InventoryItems.css";

import Quagga from "@ericblade/quagga2";
import { Button } from "@lib/components/Button";
import { FormImportCSV } from "@lib/components/FormImportCSV";
import { Icon } from "@lib/components/Icon";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { NewErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";
import QRCode from "qrcode";

import { FormOverlayInventoryCollection } from "../components/FormOverlayInventoryCollection";
import { FormOverlayInventoryItem } from "../components/FormOverlayInventoryItem";
import { FormOverlayShopItem } from "../components/FormOverlayShopItem";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import { InventoryCollectionState } from "../states/InventoryCollection";
import type { InventoryItem } from "../states/InventoryItem";
import { InventoryItemState } from "../states/InventoryItem";
import { ShopItemState } from "../states/ShopItem";
import { PermissionComponentsEnum } from "../types/Permission";
import type { InventoryItemFields } from "../utilities/CSVToInventoryItems";
import { CSVToInventoryItems } from "../utilities/CSVToInventoryItems";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectInventory,
  WebFormOverlayInventoryItemQuantity,
  WebGlobalAllItems,
  WebGlobalImage,
  WebGlobalLocation,
  WebGlobalName,
  WebInventoryImportItems,
  WebInventoryItemFromBarcode,
  WebInventoryItemFromBarcodeSuccess,
  WebInventoryItemsEditCollection,
  WebInventoryItemsImportFromCSV,
  WebInventoryItemsResetCollection,
  WebInventoryItemsSearch,
  WebInventoryItemsStopScanning,
  WebInventoryItemsUpdateCollection,
} from "../yaml8n";

function inventoryQuantity(): m.Component<InventoryItem> {
  return {
    view: (vnode): m.Children => {
      return m("div.InventoryItems__buttons", [
        m(Icon, {
          classes: "GlobalButtonIconAdd",
          icon: Icons.Delete,
          onclick: async (e: m.Event<MouseEvent>) => {
            e.stopPropagation();

            return InventoryItemState.update({
              ...vnode.attrs,
              quantity: vnode.attrs.quantity - 1,
            });
          },
          style: {
            visibility:
              vnode.attrs.quantity > 0 &&
              GlobalState.permitted(PermissionComponentsEnum.Inventory, true)
                ? undefined
                : "hidden",
          },
        }),
        m("span", vnode.attrs.quantity),
        GlobalState.permitted(PermissionComponentsEnum.Inventory, true)
          ? m(Icon, {
              classes: "GlobalButtonIconAdd",
              icon: Icons.Add,
              onclick: async (e: m.Event<MouseEvent>) => {
                e.stopPropagation();

                return InventoryItemState.update({
                  ...vnode.attrs,
                  quantity: vnode.attrs.quantity + 1,
                });
              },
              style: {
                visibility: GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                )
                  ? undefined
                  : "hidden",
              },
            })
          : [],
        GlobalState.permitted(PermissionComponentsEnum.Shop, true)
          ? m(Icon, {
              classes: `GlobalButtonIconAdd${
                ShopItemState.findName(vnode.attrs.name).name === ""
                  ? ""
                  : "InventoryItems__button--disabled"
              }`,
              icon: Icons.Shop,
              onclick: async (e: m.Event<MouseEvent>) => {
                e.stopPropagation();

                if (ShopItemState.findName(vnode.attrs.name).name !== "") {
                  AppState.setLayoutAppAlert({
                    message: "Item already on shopping list",
                  });

                  return;
                }

                AppState.setLayoutAppForm(FormOverlayShopItem, {
                  ...ShopItemState.new(),
                  ...{
                    authHouseholdID: vnode.attrs.authHouseholdID,
                    name: vnode.attrs.name,
                  },
                });
              },
              style: {
                visibility: GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                )
                  ? undefined
                  : "hidden",
              },
            })
          : [],
      ]);
    },
  };
}

export function InventoryItems(): m.Component {
  const defaultColumns = {
    image: "",
    quantity: "",
    name: "", // eslint-disable-line sort-keys
    [`properties.${AuthAccountState.translate(WebGlobalLocation)}`]: "", // eslint-disable-line sort-keys
  };
  const state = {
    collection: InventoryCollectionState.new(),
    collectionID: Stream(""),
    columns: Stream<FilterType>(Clone(defaultColumns)),
    formImport: {
      fields: {
        Name: "",
        Quantity: "",
        UPC: "",
      } as InventoryItemFields,
      visible: false,
    },
    household: AuthHouseholdState.findID(
      AuthAccountState.data().primaryAuthHouseholdID,
    ),
    scanning: false,
    search: Stream(""),
    sort: Stream({
      invert: false,
      property: "name",
    }),
    wait: false,
    waiting: 0,
  };

  function setFormInventoryItemStateProperties(): InventoryItem {
    const properties: FilterType = {};

    for (const key of Object.keys(state.columns())) {
      if (key.startsWith("properties.")) {
        properties[key.replace("properties.", "")] = state.columns()[key];
      }
    }

    return {
      ...InventoryItemState.new(),
      ...{
        properties: properties,
      },
    };
  }

  async function closeScanner(): Promise<void> {
    document.getElementsByTagName("body")[0].style.visibility = "visible";

    if (document.getElementsByTagName("canvas")[0] !== undefined) {
      document.getElementsByTagName("canvas")[0].remove();
    }

    if (document.getElementsByTagName("video")[0] !== undefined) {
      document.getElementsByTagName("video")[0].pause();
      document.getElementsByTagName("video")[0].remove();
    }

    await Quagga.stop();

    state.scanning = false;
  }

  let data: Stream<InventoryItem[]>;

  return {
    oninit: async (): Promise<void> => {
      Stream.lift(
        (_inventoryCollection, id) => {
          if (id === "all" || id === "") {
            state.collection = InventoryCollectionState.new();
            state.collection.columns = Clone(defaultColumns);
            state.collection.name =
              AuthAccountState.translate(WebGlobalAllItems);
          } else {
            state.collection = InventoryCollectionState.findID(id);
          }

          AppState.setLayoutApp({
            ...GetHelp("inventory"),
            breadcrumbs: [
              {
                link: "/inventory",
                name: AuthAccountState.translate(ObjectInventory),
              },
              {
                name: state.collection.name,
              },
            ],
            toolbarActionButtons: [
              {
                ...AppToolbarActions().newInventoryItem,
                ...{
                  onclick: (): void => {
                    AppState.setLayoutAppForm(
                      FormOverlayInventoryItem,
                      setFormInventoryItemStateProperties(),
                    );
                  },
                },
              },
              {
                icon: Icons.Scan,
                name: AuthAccountState.translate(WebInventoryItemFromBarcode),
                onclick: async (): Promise<void> => {
                  await Quagga.init(
                    {
                      decoder: {
                        readers: ["ean_reader"],
                      },
                      inputStream: {
                        constraints: {
                          aspectRatio: {
                            ideal: 1920 / 1080,
                          },
                        },
                        name: "Live",
                        target: "#scanner",
                        type: "LiveStream",
                      },
                    },
                    (err) => {
                      if (err !== undefined) {
                        NewErr(`InventoryItems: error scanning: ${err}`);
                      }

                      state.scanning = true;
                      Quagga.start();

                      m.redraw();
                    },
                  );

                  Quagga.onProcessed((result) => {
                    const drawingCtx = Quagga.canvas.ctx.overlay,
                      drawingCanvas = Quagga.canvas.dom.overlay;

                    if (result !== null) {
                      if (result.boxes !== null) {
                        drawingCtx.clearRect(
                          0,
                          0,
                          parseInt(
                            drawingCanvas.getAttribute("width") as string,
                          ),
                          parseInt(
                            drawingCanvas.getAttribute("height") as string,
                          ),
                        );
                        result.boxes
                          .filter((box) => {
                            return box !== result.box;
                          })
                          .forEach((box) => {
                            Quagga.ImageDebug.drawPath(
                              box,
                              { x: 0, y: 1 },
                              drawingCtx,
                              { color: "green", lineWidth: 2 },
                            );
                          });
                      }

                      if (result.box !== undefined) {
                        Quagga.ImageDebug.drawPath(
                          result.box,
                          { x: 0, y: 1 },
                          drawingCtx,
                          { color: "#00F", lineWidth: 2 },
                        );
                      }

                      if (
                        result.codeResult !== undefined &&
                        result.codeResult.code !== undefined
                      ) {
                        Quagga.ImageDebug.drawPath(
                          result.line,
                          { x: "x", y: "y" },
                          drawingCtx,
                          { color: "red", lineWidth: 3 },
                        );
                      }
                    }
                  });

                  Quagga.onDetected(async (result) => {
                    if (result.codeResult.code !== null && !state.wait) {
                      const errors: number[] = result.codeResult.decodedCodes
                        .filter((_) => {
                          return _.error !== undefined;
                        })
                        .map((_) => {
                          if (_.error === undefined) {
                            return 0;
                          }
                          return _.error;
                        });

                      let median = 0;

                      errors.sort((a, b) => {
                        return a - b;
                      });
                      const half = Math.floor(errors.length / 2);
                      if (errors.length % 2 === 1) {
                        median = errors[half];
                      }
                      median = (errors[half - 1] + errors[half]) / 2.0;

                      if (median > 0.09) {
                        return;
                      }

                      state.waiting++;
                      state.wait = true;

                      setTimeout(() => {
                        state.waiting--;
                        if (state.waiting === 0) {
                          state.wait = false;
                        }
                      }, 1000);

                      let item = InventoryItemState.findUPC(
                        result.codeResult.code,
                      );

                      if (item.id === null) {
                        item = setFormInventoryItemStateProperties();
                        item.upc = result.codeResult.code;
                        AppState.setLayoutAppForm(
                          FormOverlayInventoryItem,
                          item,
                        );
                      } else {
                        item.quantity++;
                        return InventoryItemState.update(item, true).then(
                          () => {
                            AppState.setLayoutAppAlert({
                              message: `${AuthAccountState.translate(WebInventoryItemFromBarcodeSuccess)} 1 ${item.name}`,
                            });
                          },
                        );
                      }

                      m.redraw();
                    }
                  });

                  m.redraw();
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                ),
                requireOnline: true,
              },
              {
                icon: Icons.ImportExport,
                name: AuthAccountState.translate(
                  WebInventoryItemsImportFromCSV,
                ),
                onclick: (): void => {
                  state.formImport.visible = true;
                },
                permitted: GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                ),
                requireOnline: true,
              },
              AppToolbarActions().newInventoryCollection,
            ],
          });

          state.columns({
            ...state.collection.columns,
          });
          state.sort(state.collection.sort);

          m.redraw();
        },
        InventoryCollectionState.data,
        state.collectionID,
      );

      data = Stream.lift(
        (items, columns, search, sort) => {
          return Filter.array(items, columns, sort).filter((item) => {
            let s = `quantity=${item.quantity} name=${item.name} upc=${item.upc}`;

            Object.keys(item.properties).map((key) => {
              s += ` ${key}=${item.properties[key]}`;
            });

            return (
              search === "" || s.toLowerCase().includes(search.toLowerCase())
            );
          });
        },
        InventoryItemState.data,
        state.columns,
        state.search,
        state.sort,
      );

      if (m.route.param().collection === undefined) {
        state.collectionID("");
      } else {
        state.collectionID(m.route.param().collection);
      }

      if (m.route.param().household === undefined) {
        m.route.param().household = state.household.id;
      } else {
        state.household = AuthHouseholdState.findID(m.route.param().household);
      }

      if (m.route.param().id !== undefined) {
        let data = InventoryItemState.new();
        InventoryItemState.data.map(() => {
          data = InventoryItemState.findID(m.route.param().id);
        });
        AppState.setLayoutAppForm(FormOverlayInventoryItem, data);
      }

      if (m.route.param().name !== undefined) {
        state.columns({
          ...state.columns(),
          name: m.route.param().name,
        });
      }
    },
    onremove: async (): Promise<void> => {
      data.end(true);

      await closeScanner();
    },
    view: (): m.Children => {
      return [
        m(FormImportCSV, {
          fields: state.formImport.fields,
          merge: true,
          oninput: (field: string, value: string): void => {
            state.formImport.fields[field] = value;

            if (field !== value) {
              delete state.formImport.fields[value];
            }
          },
          onsubmit: async (csvData): Promise<void> => {
            await CSVToInventoryItems(csvData, state.formImport.fields);
          },
          title: AuthAccountState.translate(WebInventoryImportItems),
          toggle: (visible) => {
            state.formImport.visible = visible;
          },
          visible: state.formImport.visible,
        }),
        m("div.InventoryItems__scanner#scanner"),
        state.scanning
          ? m(Button, {
              accent: true,
              name: AuthAccountState.translate(WebInventoryItemsStopScanning),
              onclick: async (): Promise<void> => {
                await closeScanner();
              },
              permitted: true,
              requireOnline: false,
            })
          : [],
        m(Table, {
          actions: [
            {
              accent: true,
              icon: Icons.Cancel,
              name: AuthAccountState.translate(
                WebInventoryItemsResetCollection,
              ),
              onclick: async (): Promise<void> => {
                return new Promise((resolve) => {
                  state.columns(
                    InventoryCollectionState.findID(state.collection.id)
                      .columns,
                  );

                  return resolve();
                });
              },
              permitted:
                GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                ) &&
                state.collection.id !== null &&
                JSON.stringify(state.columns()) !==
                  JSON.stringify(
                    InventoryCollectionState.findID(state.collection.id)
                      .columns,
                  ),
              requireOnline: true,
            },
            {
              icon: Icons.Edit,
              name: AuthAccountState.translate(WebInventoryItemsEditCollection),
              onclick: async (): Promise<void> => {
                AppState.setLayoutAppForm(FormOverlayInventoryCollection, {
                  ...state.collection,
                  ...{
                    columns: state.columns(),
                  },
                });
              },
              permitted:
                GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                ) && state.collection.id !== null,
              requireOnline: true,
            },
            {
              icon: Icons.Save,
              name: AuthAccountState.translate(
                WebInventoryItemsUpdateCollection,
              ),
              onclick: async (): Promise<void> => {
                state.collection.columns = state.columns();

                return InventoryCollectionState.update(state.collection).then(
                  () => {
                    state.columns(
                      InventoryCollectionState.findID(state.collection.id)
                        .columns,
                    );
                  },
                );
              },
              permitted:
                GlobalState.permitted(
                  PermissionComponentsEnum.Inventory,
                  true,
                ) &&
                state.collection.id !== null &&
                JSON.stringify(state.columns()) !==
                  JSON.stringify(
                    InventoryCollectionState.findID(state.collection.id)
                      .columns,
                  ),
              primary: true,
              requireOnline: true,
            },
          ],
          data: data(),
          editOnclick: async (item: InventoryItem): Promise<void> => {
            const data = Clone(item);
            data.qrlink = InventoryItemState.getLink(data.id);
            data.qrcode = await QRCode.toDataURL(data.qrlink);
            AppState.setLayoutAppForm(FormOverlayInventoryItem, data);
          },
          filters: [],
          loaded: InventoryItemState.isLoaded(),
          search: {
            onsearch: (e: string): void => {
              state.search(e);
            },
            placeholder: AuthAccountState.translate(WebInventoryItemsSearch),
          },
          sort: state.sort,
          staticColumns: false,
          tableColumns: [
            {
              name: "ID",
              property: "id",
            },
            {
              name: AuthAccountState.translate(WebGlobalImage),
              noFilter: true,
              noSort: true,
              property: "image",
              type: TableDataType.Image,
            },
            {
              name: AuthAccountState.translate(
                WebFormOverlayInventoryItemQuantity,
              ),
              property: "quantity",
              render: inventoryQuantity,
            },
            {
              name: AuthAccountState.translate(WebGlobalName),
              property: "name",
            },
            ...InventoryItemState.properties().map((property) => {
              return {
                formatter: (e: InventoryItem): string => {
                  if (e.properties[property] !== undefined) {
                    return e.properties[property]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                  }

                  return "";
                },
                name: property,
                property: `properties.${property}`,
              };
            }),
            TableColumnHousehold(),
          ],
          tableColumnsNameEnabled: state.columns,
        }),
      ];
    },
  };
}
