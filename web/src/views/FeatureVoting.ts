import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { FormItemIcons } from "@lib/components/FormItemIcons";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { ActionCancel, ActionDelete, ActionUpdate } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { TitleTabsAuthHousehold } from "../components/TitleTabsAuthHouseholds";
import { AdminFeatureVoteState } from "../states/AdminFeatureVote";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { InfoState } from "../states/Info";
import { GetHelp } from "../utilities/GetHelp";
import { WebFeatureVotingComment, WebFeatureVotingCommentTooltip, WebFeatureVotingDescription, WebFeatureVotingSubtitle1, WebFeatureVotingSubtitle2, WebFeatureVotingVotes, WebFeatureVotingVotesTooltip, WebGlobalFeatureVoting } from "../yaml8n";

export function FeatureVoting (): m.Component {
	const columns = Stream<FilterType>({
		description: "",
		amount: "", // eslint-disable-line sort-keys
		comment: "",
	});

	const formState = {
		data: AuthHouseholdState.newFeatureVote(),
		visible: false,
	};

	const options = InfoState.data.map((info) => {
		if (info.featureVotes !== undefined) {
			return info.featureVotes;
		}

		return [];
	});

	let id = AuthAccountState.data().primaryAuthHouseholdID;

	return {
		oninit: async (): Promise<void> => {
			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(WebGlobalFeatureVoting),
					},
				],
				toolbarActionButtons: [],
			});

			if (m.route.param().household === undefined) {
				m.route.param().household = id;
			} else {
				id = m.route.param().household;
			}

			if (AppState.isSessionAdmin()) {
				await AdminFeatureVoteState.read();
				m.redraw();
			}

			if (AppState.getSessionDisplay() < 2) {
				columns({
					description: "",
					amount: "", // eslint-disable-line sort-keys
				});
			}

			if (Object.keys(columns()).length === 0) {
				switch (AppState.getSessionDisplay()) {
				case DisplayEnum.XLarge:
					columns({
						image: "",
						name: "",
						created: "", // eslint-disable-line sort-keys
						time: "",
						rating: "", // eslint-disable-line sort-keys
						cookScheduleLast: "", // eslint-disable-line sort-keys
						cookScheduleCount: "", // eslint-disable-line sort-keys
					});
					break;
				case DisplayEnum.Large:
					columns({
						image: "",
						name: "",
						created: "", // eslint-disable-line sort-keys
						time: "",
						rating: "", // eslint-disable-line sort-keys
						cookScheduleLast: "", // eslint-disable-line sort-keys
					});
					break;
				case DisplayEnum.Medium:
				case DisplayEnum.Small:
				case DisplayEnum.XSmall:
					columns({
						image: "",
						name: "",
						rating: "",
					});
					break;
				}
			}
		},
		view: (): m.Children => {
			return [
				formState.visible ?
					m(Form, {
						buttons: [
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									formState.visible = false;
								},
								permitted: true,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(ActionUpdate),
								onclick: async (): Promise<void> => {
									const ah = AuthHouseholdState.findID(id);

									const i = ah.featureVotes.findIndex((household) => {
										return household.feature === formState.data.feature;
									});

									if (i < 0) {
										ah.featureVotes.push(formState.data);
									} else {
										ah.featureVotes[i] = formState.data;
									}

									return AuthHouseholdState.update(ah)
										.then(() => {
											formState.visible = false;
										});
								},
								permitted: true,
								primary: true,
								requireOnline: true,
							},
						],
						overlay: true,
						title: {
							name: `${AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(WebGlobalFeatureVoting)}`,
						},
					}, [
						m(FormItem, {
							input: {
								disabled: true,
								oninput: () => {},
								type: "text",
								value: options()[formState.data.feature],
							},
							name: AuthAccountState.translate(WebFeatureVotingDescription),
							tooltip: "",
						}),
						m(FormItemIcons, {
							iconSelect: Icons.RatingSelect,
							iconUnselect: Icons.RatingUnselect,
							max: 5 - AuthHouseholdState.findID(id).featureVotes.map((vote) => {
								if (vote.feature === formState.data.feature) {
									return 0;
								}

								return vote.amount;
							})
								.reduce((t, v) => {
									return t + v;
								}, 0),
							name: AuthAccountState.translate(WebFeatureVotingVotes),
							onclick: (e: number) => {
								formState.data.amount = e;
							},
							tooltip: AuthAccountState.translate(WebFeatureVotingVotesTooltip),
							value: formState.data.amount,
						}),
						m(FormItem, {
							name: AuthAccountState.translate(WebFeatureVotingComment),
							textArea: {
								oninput: (e: string): void => {
									formState.data.comment = e;
								},
								value: formState.data.comment,
							},
							tooltip: AuthAccountState.translate(WebFeatureVotingCommentTooltip),
						}),
					]) :
					[],
				m(Table, {
					actions: [
						{
							accent: true,
							icon: Icons.Delete,
							name: AuthAccountState.translate(ActionDelete),
							onclick: async (): Promise<void> => {
								return AdminFeatureVoteState.delete()
									.then(async () => {
										return AdminFeatureVoteState.read();
									})
									.then(async () => {
										m.redraw();
									});
							},
							permitted: AppState.isSessionAdmin(),
							requireOnline: true,
						},
					],
					data: options(),
					editOnclick: (s: string) => {
						const i = options()
							.indexOf(s);

						const vi = AuthHouseholdState.findID(id)
							.featureVotes.findIndex((vote) => {
								return vote.feature === i;
							});

						if (vi < 0) {
							formState.data = AuthHouseholdState.newFeatureVote();
							formState.data.feature = i;
						} else {
							formState.data = AuthHouseholdState.findID(id).featureVotes[vi];
						}
						formState.visible = true;
					},
					filters: [],
					getKey: (e: string) => {
						return e;
					},
					loaded: true,
					noFilters: true,
					tableColumns: [
						{
							formatter: (e: string): string => {
								return e;
							},
							name: AuthAccountState.translate(WebFeatureVotingDescription),
							noFilter: true,
							property: "description",
						},
						{
							formatter: (e: string): string => {
								const i = options()
									.indexOf(e);

								let amount = 0;

								if (AppState.isSessionAdmin()) {
									const vi = AdminFeatureVoteState.data()
										.findIndex((vote) => {
											return vote.feature === i;
										});

									if (AdminFeatureVoteState.data()[vi] !== undefined) {
										amount = AdminFeatureVoteState.data()[vi].amount;
									}

									return `${amount}`;
								}

								const vi = AuthHouseholdState.findID(id)
									.featureVotes.findIndex((vote) => {
										return vote.feature === i;
									});

								if (AuthHouseholdState.findID(id).featureVotes[vi] !== undefined) {
									amount = AuthHouseholdState.findID(id).featureVotes[vi].amount;
								}


								let icons = "";
								for (let i = 1; i < 6; i++) {
									if (i <= amount) {
										icons += `${Icons.RatingSelect} `;
									}
								}

								return icons;
							},
							name: AuthAccountState.translate(WebFeatureVotingVotes),
							noFilter: true,
							property: "amount",
							type: AppState.isSessionAdmin() ?
								TableDataType.Text :
								TableDataType.Icon,
						},
						{
							formatter: (e: string): string => {
								const i = options()
									.indexOf(e);

								if (AppState.isSessionAdmin()) {
									const vi = AdminFeatureVoteState.data()
										.findIndex((vote) => {
											return vote.feature === i;
										});

									if (AdminFeatureVoteState.data()[vi] !== undefined) {
										return AdminFeatureVoteState.data()[vi].comment;
									}
								} else {
									const vi = AuthHouseholdState.findID(id)
										.featureVotes.findIndex((vote) => {
											return vote.feature === i;
										});

									if (AuthHouseholdState.findID(id).featureVotes[vi] !== undefined) {
										return AuthHouseholdState.findID(id).featureVotes[vi].comment;
									}
								}


								return "";
							},
							name: AuthAccountState.translate(WebFeatureVotingComment),
							noFilter: true,
							property: "comment",
						},
					],
					tableColumnsNameEnabled: columns,
					title: {
						subtitles: [
							{
								key: "",
								value: AuthAccountState.translate(WebFeatureVotingSubtitle1),
							},
							{
								key: "",
								value: AuthAccountState.translate(WebFeatureVotingSubtitle2),
							},
						],
						tabs: TitleTabsAuthHousehold(),
					},
				}),
			];
		},
	};
}
