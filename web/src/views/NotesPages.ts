import { ButtonArray } from "@lib/components/ButtonArray";
import { Table } from "@lib/components/Table";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { FormLastUpdated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { NotesPage } from "../states/NotesPage";
import { NotesPageState } from "../states/NotesPage";
import { NotesPageVersionState } from "../states/NotesPageVersion";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectHousehold, ObjectNotes, ObjectPage, ObjectParentPage, WebGlobalActionShowDeleted, WebGlobalActionShowTag, WebGlobalAll,  WebGlobalName, WebGlobalPersonal, WebNotesPagesSearch } from "../yaml8n";

interface PageList {
	authAccountID: NullUUID,
	createdBy: NullUUID,
	id: NullUUID,
	name: string,
	parentID: NullUUID,
	tags: string[],
	updated: NullTimestamp,
}

export function NotesPages (): m.Component {
	const state = {
		columns: Stream<FilterType>({
			name: "",
			parentID: "",
			updated: "",
		}),
		deleted: Stream<boolean>(false),
		filter: Stream(""),
		search: Stream(""),
		sort: Stream({
			invert: false,
			property: "name",
		}),
		tag: Stream(""),
		tags: [] as string[],
		title: "All",
	};

	let data: Stream<NotesPage[]>;

	function NotesPagesName (): m.Component<PageList> {
		return {
			view: (vnode): m.Children => {
				return m("div", {
					style: {
						"align-items": "flex-start",
						"display": "flex",
						"flex-direction": "column",
					},
				}, [
					vnode.attrs.name,
					m(ButtonArray, {
						icon: Icons.Tag,
						name: "tags",
						onclick: (e): void => {
							state.tag() === e ?
								state.tag("") :
								state.tag(e);
						},
						selected: () => {
							return [
								state.tag(),
							];
						},
						small: true,
						value: vnode.attrs.tags,
					}),
				]);
			},
		};
	}


	return {
		oninit: async (): Promise<void> => {
			data = Stream.lift((pagestate, _versions, columns, deleted, filter, search, sort, tag) => {
				const data = NotesPageState.filter(pagestate, deleted, filter, search, tag, (page) => {
					return page.name.toLowerCase()
						.includes(search.toLowerCase()) || NotesPageVersionState.findNotesPageIDLatest(page.id).body.toLowerCase()
						.includes(search.toLowerCase());
				});

				state.tags = data.tags;

				return Filter.array(data.data, columns, sort);
			}, NotesPageState.data, NotesPageVersionState.data, state.columns, state.deleted, state.filter, state.search, state.sort, state.tag);

			switch(m.route.param().tag) {
			case undefined:
				break;
			case "household":
				state.filter("household");
				state.title = AuthAccountState.translate(ObjectHousehold);
				break;
			case "personal":
				state.filter("personal");
				state.title = AuthAccountState.translate(WebGlobalPersonal);
				break;
			default:
				state.tag(m.route.param().tag);
				state.title = state.tag();
			}

			if (m.route.param().deleted !== undefined) {
				state.deleted(true);
			}

			AppState.setLayoutApp({
				...GetHelp("notes"),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(ObjectNotes),
					},
				],
				toolbarActionButtons: [
					{
						icon: Icons.Notes,
						name: AuthAccountState.translate(ObjectPage),
						onclick: (): void => {
							m.route.set(`/notes/${state.filter() === "" ?
								"personal" :
								state.filter()}/new?edit`);
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Notes, true, AuthAccountState.data().primaryAuthHouseholdID),
						requireOnline: true,
					},
				],
			});
		},
		onremove: (): void => {
			data.end(true);
		},
		view: (): m.Children => {
			return [
				m(Table, {
					actions: [
						{
							icon: Icons.Delete,
							name: AuthAccountState.translate(WebGlobalActionShowDeleted),
							onclick: async (): Promise<void> => {
								return new Promise((resolve) => {
									state.deleted(! state.deleted());
									state.tag("");

									return resolve();
								});
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
							requireOnline: false,
							secondary: state.deleted(),
						},
					],
					data: data(),
					editOnclick: (page: NotesPage) => {
						if (page.authAccountID === null) {
							m.route.set(`/notes/household/${page.id}`);
						} else {
							m.route.set(`/notes/personal/${page.id}`);
						}
					},
					filters: [
						{
							icon: Icons.Tag,
							name: AuthAccountState.translate(WebGlobalActionShowTag),
							onclick: (e): void => {
								state.tag() === e ?
									state.tag("") :
									state.tag(e);
							},
							selected: (): string[] => {
								return[
									state.tag(),
								];
							},
							value: state.tags,
						},
					],
					loaded: NotesPageState.isLoaded(),
					search: {
						onsearch: (e: string): void => {
							state.search(e);
						},
						placeholder: AuthAccountState.translate(WebNotesPagesSearch),
					},
					sort: state.sort,
					tableColumns: [
						{
							name: AuthAccountState.translate(WebGlobalName),
							noFilter: true,
							property: "name",
							render: NotesPagesName,
						},
						{
							formatter: (page: NotesPage): string => {
								return NotesPageState.findID(page.parentID).name;
							},
							name: AuthAccountState.translate(ObjectParentPage),
							noFilter: true,
							property: "parentID",
						},
						{
							formatter: (page: NotesPage): string => {
								return AppState.formatCivilDate(Timestamp.fromString(NotesPageVersionState.findNotesPageIDLatest(page.id).updated!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
									.toCivilDate()
									.toJSON());
							},
							name: AuthAccountState.translate(FormLastUpdated),
							noFilter: true,
							property: "updated",
						},
						TableColumnHousehold(),
					],
					tableColumnsNameEnabled: state.columns,
					title: {
						tabs: [
							{
								active: state.filter() === "",
								href: "/notes",
								name: AuthAccountState.translate(WebGlobalAll),
							},
							{
								active: state.filter() === "personal",
								href: "/notes/personal",
								name: AuthAccountState.translate(WebGlobalPersonal),
							},
							{
								active: state.filter() === "household",
								href: "/notes/household",
								name: AuthAccountState.translate(ObjectHousehold),
							},
						],
					},
				}),
			];
		},
	};
}
