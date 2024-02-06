import { FormImage } from "@lib/components/FormImage";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputIcon } from "@lib/components/FormItemInputIcon";
import { FormItemInputProperties } from "@lib/components/FormItemInputProperties";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import type { FilterType } from "@lib/types/Filter";
import { Animate, Animation } from "@lib/utilities/Animate";
import { StringCapitalize } from "@lib/utilities/StringCapitalize";
import m from "mithril";
import QRCode from "qrcode";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { InventoryCollection } from "../states/InventoryCollection";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectCollection,
  WebFormOverlayInventoryCollectionPropertyFilters,
  WebFormOverlayInventoryCollectionPropertyFiltersTooltip,
  WebGlobalActionFilter,
  WebGlobalGrouping,
  WebGlobalGroupingTooltip,
  WebGlobalImage,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebGlobalQRCode,
} from "../yaml8n";

export function FormOverlayInventoryCollection(): m.Component<
  FormOverlayComponentAttrs<InventoryCollection>
> {
  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    oninit: async (vnode): Promise<void> => {
      if (
        vnode.attrs.data.id !== null &&
        vnode.attrs.data.qrlink === undefined
      ) {
        vnode.attrs.data.qrlink = InventoryCollectionState.getLink(
          vnode.attrs.data.id,
        );
        vnode.attrs.data.qrcode = await QRCode.toDataURL(
          vnode.attrs.data.qrlink,
        );
        m.redraw();
      }
    },
    onupdate: async (vnode): Promise<void> => {
      if (
        vnode.attrs.data.id !== null &&
        vnode.attrs.data.qrlink === undefined
      ) {
        vnode.attrs.data.qrlink = InventoryCollectionState.getLink(
          vnode.attrs.data.id,
        );
        vnode.attrs.data.qrcode = await QRCode.toDataURL(
          vnode.attrs.data.qrlink,
        );
        m.redraw();
      }
    },
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [],
          data: vnode.attrs.data,
          name: AuthAccountState.translate(ObjectCollection),
          onDelete: async (): Promise<void | Err> => {
            return InventoryCollectionState.delete(vnode.attrs.data.id).then(
              () => {
                if (
                  m.route.get().includes(`/inventory/${vnode.attrs.data.id}`)
                ) {
                  m.route.set("/inventory", "", {
                    state: {
                      key: Date.now(),
                    },
                  });
                }
              },
            );
          },
          onSubmit: async (): Promise<InventoryCollection | void | Err> => {
            if (vnode.attrs.data.id === null) {
              return InventoryCollectionState.create(vnode.attrs.data).then(
                (collection) => {
                  if (IsErr(collection)) {
                    return collection;
                  }

                  m.route.set(`/inventory/${collection.id}`, "", {
                    state: {
                      key: Date.now(),
                    },
                  });

                  return;
                },
              );
            }

            return InventoryCollectionState.update(vnode.attrs.data);
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Inventory,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Inventory,
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
          m(FormItem, {
            input: {
              datalist: InventoryCollectionState.groupingNames(),
              oninput: (e: string): void => {
                vnode.attrs.data.grouping = e;
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.grouping,
            },
            name: AuthAccountState.translate(WebGlobalGrouping),
            tooltip: AuthAccountState.translate(WebGlobalGroupingTooltip),
          }),
          m(FormItemInputIcon, {
            oninput: (e: string): void => {
              vnode.attrs.data.icon = e;
            },
            value: vnode.attrs.data.icon,
          }),
          m(FormItemInputProperties, {
            data: vnode.attrs.data.columns,
            getKey: (key): string => {
              return StringCapitalize(key.replace("properties.", ""));
            },
            getValue: (key): string => {
              return vnode.attrs.data.columns[key] as string;
            },
            keyOninput: (key, input): void => {
              let data: FilterType = {};

              let name = input;

              switch (name) {
                case "":
                case AuthAccountState.translate(WebGlobalImage):
                case AuthAccountState.translate(WebGlobalName):
                  name = input.toLowerCase();
                  break;
                default:
                  name = `properties.${input}`;
              }

              for (const column of Object.keys(vnode.attrs.data.columns)) {
                if (key === column) {
                  data = {
                    ...data,
                    [name]: vnode.attrs.data.columns[key],
                  };
                } else {
                  data = {
                    ...data,
                    [column]: vnode.attrs.data.columns[column],
                  };
                }
              }

              vnode.attrs.data.columns = data;
            },
            keyValues: (key): string[] => {
              return InventoryItemState.findPropertyValues(key);
            },
            name: AuthAccountState.translate(
              WebFormOverlayInventoryCollectionPropertyFilters,
            ),
            nameSingle: AuthAccountState.translate(WebGlobalActionFilter),
            properties: InventoryItemState.properties(),
            tooltip: AuthAccountState.translate(
              WebFormOverlayInventoryCollectionPropertyFiltersTooltip,
            ),
            valueOninput: (key, input) => {
              vnode.attrs.data.columns[key] = input;
            },
          }),
          vnode.attrs.data.id === null
            ? []
            : m(FormImage, {
                disabled: true,
                name: AuthAccountState.translate(WebGlobalQRCode),
                onclick: () => {
                  const image = new Image();
                  image.src = vnode.attrs.data.qrcode as string;

                  const w = window.open("");
                  (w as Window).document.write(image.outerHTML);
                },
                oninput: () => {},
                text: vnode.attrs.data.qrlink,
                value: vnode.attrs.data.qrcode,
              }),
        ],
      );
    },
  };
}
