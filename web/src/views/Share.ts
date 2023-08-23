import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import type { Err } from "@lib/services/Log";
import { ActionAdd } from "@lib/yaml8n";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { BookmarkState } from "../states/Bookmark";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { PlanTaskState } from "../states/PlanTask";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectTask, WebGlobalActionImportBookmarkFromWebsite, WebGlobalActionImportRecipeFromWebsite, WebGlobalActionShare, WebGlobalName, WebGlobalNameTooltip, WebGlobalURL, WebGlobalURLTooltip } from "../yaml8n";

export function Share (): m.Component {
	const state = {
		title: "",
		url: "",
	};

	return {
		oninit: (): void => {
			if (m.route.param().title !== undefined) {
				state.title = m.route.param().title.replace(/\+/g, " ");
			}
			state.url = m.route.param().text;
		},
		view: (): m.Children => {
			return m(Form, {
				buttons: [
					{
						name: AuthAccountState.translate(WebGlobalActionImportRecipeFromWebsite),
						onclick: async (): Promise<void | Err> => {
							return CookRecipeState.importURL(state.url, AuthAccountState.data().primaryAuthHouseholdID);
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
						primary: true,
						requireOnline: true,
					},
					{
						name: AuthAccountState.translate(WebGlobalActionImportBookmarkFromWebsite),
						onclick: async (): Promise<void> => {
							return BookmarkState.create({
								...BookmarkState.new(),
								...{
									authAccountID: AuthAccountState.data().id,
									link: state.url,
									name: state.title,
								},
							})
								.then(() => {
									m.route.set("/bookmarks");
								});
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true),
						primary: true,
						requireOnline: true,
					},
					{
						name: `${AuthAccountState.translate(ActionAdd)} ${AuthAccountState.translate(ObjectTask)}`,
						onclick: async (): Promise<void> => {
							return PlanTaskState.create({
								...PlanTaskState.new(),
								...{
									authAccountID: AuthAccountState.data().id,
									name: `[${state.title}](${state.url})`,
								},
							})
								.then(() => {
									m.route.set("/plan/tasks");
								});
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true),
						primary: true,
						requireOnline: true,
					},
				],
				title: {
					name: AuthAccountState.translate(WebGlobalActionShare),
				},
			}, [
				m(FormItem, {
					input: {
						oninput: (e): void => {
							state.title = e;
						},
						type: "text",
						value: state.title,
					},
					name: AuthAccountState.translate(WebGlobalName),
					tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
				}),
				m(FormItem, {
					input: {
						oninput: (e): void => {
							state.url = e;
						},
						type: "url",
						value: state.url,
					},
					name: AuthAccountState.translate(WebGlobalURL),
					tooltip: AuthAccountState.translate(WebGlobalURLTooltip),
				}),
			]);
		},
	};
}
