import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import type { DataTags } from "@lib/utilities/AggregateTags";
import { AggregateTags } from "@lib/utilities/AggregateTags";
import { Clone } from "@lib/utilities/Clone";
import type { FilterSortChildrenArguments } from "@lib/utilities/FilterSortChildren";
import { MergeArray } from "@lib/utilities/MergeArray";
import { Sort } from "@lib/utilities/Sort";
import m from "mithril";
import Stream from "mithril/stream";

import { API, ErrUnknownResponse } from "../services/API";
import type { DataTypeEnum } from "../types/DataType";
import { DataType } from "../types/DataType";
import type { TableNotify } from "../types/TableNotify";
import { TableNotifyOperationEnum } from "../types/TableNotify";
import { read } from "../utilities/Read";
import { ReadAll } from "../utilities/ReadAll";
import { Controller } from "../worker";
import { WorkerAction } from "../worker/Handler";
import type { WorkerMessageSet } from "../worker/Set";
import { WebGlobalActionUndo } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";

interface DataName extends Data {
	name: string,
}

export class DataArrayManager<T extends Data> {
	batch: T[] = [];
	batchTimer = 0;
	data = Stream<T[]>([]);
	hash = "";
	loading = 1;
	indexID = this.data.map((data) => {
		return data.reduce((o, d, i) => {
			o[d.id as string] = i;

			return o;
		}, {} as {
			[key: string]: number,
		});
	});
	indexShortID = Stream({} as {
		[key: string]: number,
	});
	names = Stream([] as string[]);
	nested = Stream([] as T[]);
	path: string;
	refreshed = false;
	refreshing = false;
	sortField: string;
	sortInvert: boolean;
	tags = Stream([] as Tag[]);
	tagNames = Stream([] as string[]);
	type: DataTypeEnum;
	typeArray: string;
	typeObject: string;
	undo?: T;

	constructor (
		path: string,
		sortField: string,
		sortInvert: boolean,
		type: DataTypeEnum,
	) {
		this.path = path;
		this.sortField = sortField;
		this.sortInvert = sortInvert;
		this.type = type;
		this.typeArray = DataType.getArray(this.type);
		this.typeObject = DataType.getObject(this.type);

		if (this.new().name !== undefined) {
			this.names = this.data.map((array) => {
				const names: string[] = [];

				for (const object of array as DataName[]) {
					if (object.deleted === undefined || object.deleted === null) {
						names.push(object.name);
					}
				}

				Sort(names);

				return names;
			});

			if (this.new().tags !== undefined) {
				this.tags = this.data.map((data) => {
					return this.formatTags(AggregateTags(this.getTaggable(data) as DataTags[]));
				});

				this.tagNames = this.tags.map((tags) => {
					return tags.map((tag) => {
						return tag.name;
					});
				});
			}
		}

		if (this.new().shortID !== undefined) {
			this.indexShortID = this.data.map((data) => {
				return data.reduce((o, d, i) => {
					o[d.shortID as string] = i;

					return o;
				}, {} as {
					[key: string]: number,
				});
			});
		}
	}

	alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = "Data created";
			break;
		case ActionsEnum.Delete:
			msg = "Data deleted";
			break;
		case ActionsEnum.Update:
			msg = "Data updated";
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	contains (value: unknown): value is T {
		return value !== null;
	}

	containsResponse (response: APIResponse<unknown>): response is APIResponse<T[]> {
		if (
			response.dataType === this.typeObject &&
			Array.isArray(response.dataValue) &&
			response.dataValue.length === 1
		) {
			return true;
		}

		NewErr(`${this.typeObject}.containsResponse:\n${response.dataType} ${JSON.stringify(response.dataValue)}`);

		return false;
	}

	async create (data: T, hideAlert?: boolean): Promise<T | Err> {
		Telemetry.spanStart(`${data.typeArray}.create`);

		return API.create(this.path, data)
			.then(async (response) => {
				Telemetry.spanEnd(`${data.typeArray}.create`);

				if (IsErr(response)) {
					AppState.setLayoutAppAlert(response, hideAlert);

					return response;
				}

				if (this.containsResponse(response)) {
					this.alertAction(ActionsEnum.Create, hideAlert);

					this.set(response.dataValue[0]);

					return response.dataValue[0];
				}

				return ErrUnknownResponse;
			});
	}

	async delete (id: NullUUID, hideAlert?: boolean): Promise<void | Err> {
		Telemetry.spanStart(`${this.typeArray}.delete`);
		return API.delete(`${this.path}/${id}`)
			.then(async (response) => {
				Telemetry.spanEnd(`${this.typeArray}.delete`);

				if (IsErr(response)) {
					AppState.setLayoutAppAlert(response, hideAlert);

					return response;
				}

				this.alertAction(ActionsEnum.Delete, hideAlert);

				this.remove(id);

				return;
			});
	}

	filter (array: T[], deleted: boolean, filter: string, search: string, tag: string, searchCheck: (data: T) => boolean): {
		/** Data that was filtered. */
		data: T[],

		/** Tags that were filtered. */
		tags: string[],
	} {
		let tags: string[] = [];

		return {
			data: array.filter((data) => {
				switch (filter) {
				case "household":
					if (data.authHouseholdID === null) {
						return false;
					}

					break;
				case "personal":
					if (data.authAccountID === null || data.authHouseholdID !== null) {
						return false;
					}

					break;
				}

				if (deleted && data.deleted !== undefined && data.deleted === null) {
					return false;
				} else if (! deleted && data.deleted !== undefined && data.deleted !== null) {
					return false;
				}

				if (data.tags !== undefined) {
					tags = MergeArray(tags, data.tags);
				}

				if (search !== "" && ! searchCheck(data)) {
					return false;
				}

				if (tag !== "" && data.tags !== undefined && ! data.tags.includes(tag)) {
					return false;
				}

				return true;
			}),
			tags: tags,
		};
	}

	findBatch (id: NullUUID): T {
		const o = this.batch
			.find((object) => {
				return object.id === id;
			});

		if (o === undefined) {
			return this.new();
		}

		return o;
	}

	findID (id: NullUUID): T {
		const i = this.indexID()[`${id}`];

		if (i === undefined) {
			return this.new();
		}

		return Clone(this.data()[i]);
	}

	findName (name: string, personal?: boolean): T {
		const i = this.data()
			.findIndex((object) => {
				if (personal === true) {
					return (
						object.authAccountID !== null && object.authHouseholdID === null && object.name === name
					);
				}

				return object.authHouseholdID !== null && object.name === name;
			});
		if (i >= 0 && this.data().length > 0) {
			return Clone(this.data()[i]);
		}

		return this.new();
	}

	findShortID (id: string): T {
		const i = this.indexShortID()[`${id}`];

		if (i === undefined) {
			return this.new();
		}

		return Clone(this.data()[i]);
	}

	findTag (tag: string, array?: T[]): T[] {
		if (array === undefined) {
			array = this.data(); // eslint-disable-line no-param-reassign
		}

		const tagData = array.filter((data) => {
			if (data.tags !== undefined && data.tags !== null) {
				return data.tags.includes(tag);
			}

			return false;
		});

		Sort(tagData, {
			property: "name",
		});
		return tagData;
	}

	formatTags (tags: Tag[]): Tag[] {
		return tags;
	}

	getTaggable (data: T[]): T[] {
		return data;
	}

	is (data: unknown): data is T[] {
		return data !== null;
	}

	inResponse (response: APIResponse<unknown>): response is APIResponse<T[]> {
		if (response.dataType === this.typeArray) {
			return true;
		}

		NewErr(`${this.typeObject}.inResponse:\n${response.dataType} ${response.dataValue}`);

		return false;
	}

	isLoaded (): boolean {
		return process.env.NODE_ENV === "test" || this.loading === 0;
	}

	new (): T {
		return {
			id: null,
			name: "",
			parentID: null,
			shortID: "",
			tags: [] as string[],
			updated: null,
		} as T;
	}

	async onSSE (n: TableNotify): Promise<void> {
		switch (n.operation) {
		case TableNotifyOperationEnum.Delete:
			this.remove(n.id);
			break;
		case TableNotifyOperationEnum.Create:
		case TableNotifyOperationEnum.Update:
			await this.read(n.id, n.updated);
		}
	}

	async read (id: NullUUID, updated?: NullTimestamp, sync?: boolean): Promise<T | void | Err> {
		if (updated !== undefined && updated === this.findID(id).updated || updated === this.findBatch(id).updated) {
			return;
		}

		Telemetry.spanStart(`${this.typeArray}.read`);

		if (sync === true) {
			return read({
				id: id,
				path: this.path,
				typeObject: this.typeObject,
			})
				.then((res) => {
					Telemetry.spanEnd(`${this.typeArray}.read`);

					if (IsErr(res)) {
						return res;
					}

					if (res.data !== undefined) {
						return res.data as T;
					}

					return;
				});
		}

		Controller.dispatch({
			action: WorkerAction.Read,
			arguments: {
				id: id,
				path: this.path,
				typeObject: this.typeObject,
			},
			type: this.type,
		});

		return;
	}

	readAll (): void {
		if (this.refreshed) {
			return;
		}

		Telemetry.spanStart(`${this.typeArray}.readAll`);

		Controller.dispatch({
			action: WorkerAction.ReadAll,
			arguments: {
				data: this.data(),
				hash: this.hash,
				newObj: this.new(),
				path: this.path,
				sortField: this.sortField,
				sortInvert: this.sortInvert,
				typeArray: this.typeArray,
			},
			type: this.type,
		});
	}

	async readAllSync (): Promise<Err | void> {
		return ReadAll({
			data: this.data(),
			hash: this.hash,
			newObj: this.new(),
			path: this.path,
			sortField: this.sortField,
			sortInvert: this.sortInvert,
			typeArray: this.typeArray,
		})
			.then((res) => {
				if (IsErr(res)) {
					return res;
				}

				if (res.data !== undefined) {
					this.data(res.data);
				}

				return;
			});
	}

	remove (id: NullUUID): void {
		const array = this.data();
		const index = array.findIndex((object) => {
			return object.id === id;
		});

		if (index >= 0) {
			array.splice(index, 1);
			this.set(array, "", true);
		}
	}

	reset (): void {
		this.data([]);
		this.hash = "";
		this.refreshed = false;
	}

	set (data?: T | T[], hash?: string, remove?: boolean): void {
		Telemetry.spanStart(`${this.typeArray}.set`);

		if (hash !== undefined && hash !== "") {
			this.hash = hash;
		}

		if (Array.isArray(data)) {
			this.refreshed = true;

			if (process.env.NODE_ENV === "test") {
				data = Clone(data); // eslint-disable-line no-param-reassign
				Sort(data, {
					invert: this.sortInvert,
					property: this.sortField,
				});
			}

			this.data(data);

			if (this.new().parentID !== undefined) {
				if (remove !== true) {
					this.setLoading();
				}

				Controller.dispatch({
					action: WorkerAction.FilterSortChildren,
					arguments: {
						input: this.data(),
					} as FilterSortChildrenArguments<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
					type: this.type,
				});
			}

			if (remove === true) {
				Controller.dispatch({
					// eslint-disable-line @typescript-eslint/consistent-type-assertions
					action: WorkerAction.Set,
					arguments: {
						data: data,
						type: this.typeArray,
					},
				} as WorkerMessageSet);
			} else {
				this.setLoading(false);
			}

			m.redraw();
		} else if (data === undefined) {
			this.setLoading(false);
		} else {
			this.batch.push(data);

			if (process.env.NODE_ENV === "test") {
				this.setBatch();
			} else {
				clearTimeout(this.batchTimer);
				this.batchTimer = window.setTimeout(async () => {
					this.setBatch();
				}, 100);
			}
		}

		Telemetry.spanEnd(`${this.typeArray}.set`);
	}

	setBatch (): void {
		const array: T[] = this.data();
		const batch = Clone(this.batch);
		this.batch = [];

		if (batch.length === 0) {
			return;
		}

		for (const d of batch) {
			const index = array.findIndex((object) => {
				return object.id === d.id;
			});

			if (index >= 0) {
				array[index] = d;
			} else {
				array.push(d);
			}
		}

		Sort(array, {
			invert: this.sortInvert,
			property: this.sortField,
		});
		this.data(array);

		if (this.new().parentID !== undefined) {
			Controller.dispatch({
				action: WorkerAction.FilterSortChildren,
				arguments: {
					input: this.data(),
				} as FilterSortChildrenArguments<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
				type: this.type,
			});
		}

		m.redraw();

		// Set data since it didn't come from a worker
		Controller.dispatch({
			// eslint-disable-line @typescript-eslint/consistent-type-assertions
			action: WorkerAction.Set,
			arguments: {
				data: array,
				type: this.typeArray,
			},
		} as WorkerMessageSet);
	}

	setLoading (loading?: boolean): void {
		if (loading === false && this.loading > 0) {
			this.loading -= 1;
		} else if (loading === false) {
			NewErr(`${this.typeArray}.setLoading: overloaded`);
		} else {
			this.loading += 1;
		}
	}

	setNested (data: T[]): void {
		this.nested(data);

		if (this.loading > 0) {
			this.setLoading(false);
		}

		m.redraw();
	}

	async update (data: T, hideAlert?: boolean): Promise<void | Err> {
		Telemetry.spanStart(`${data.typeArray}.update`);
		this.undo = this.findID(data.id);
		clearTimeout(this.batchTimer);

		return API.update(`${this.path}/${data.id}`, data)
			.then(async (response) => {
				Telemetry.spanEnd(`${data.typeArray}.update`);

				if (IsErr(response)) {
					AppState.setLayoutAppAlert(response);

					return response;
				}

				if (response.status === 0 || response.status === 204) {
					if (typeof window !== "undefined") {
						this.batchTimer = window.setTimeout(async () => {
							this.setBatch();
						}, 500);
					}

					return;
				}

				if (this.containsResponse(response)) {
					this.alertAction(ActionsEnum.Update, hideAlert, [
						{
							name: AuthAccountState.translate(WebGlobalActionUndo),
							onclick: async (): Promise<void> => {
								return this.update(this.undo as T, true)
									.then((res) => {
										if (IsErr(res)) {
											AppState.setLayoutAppAlert(res);
										}
									}); // eslint-disable-line @typescript-eslint/no-non-null-assertion
							},
						},
					]);

					if (typeof window !== "undefined") {
						this.set(response.dataValue[0]);
					}

					return;
				}

				return ErrUnknownResponse;
			});
	}
}
