import "./RewardCards.css";

import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { Title } from "@lib/components/Title";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { Icons } from "@lib/types/Icons";
import { StringCapitalize } from "@lib/utilities/StringCapitalize";
import { ActionDelete, ActionEdit, ActionNew } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayRewardCard } from "../components/FormOverlayRewardCard";
import { TitleTabsAuthHousehold } from "../components/TitleTabsAuthHouseholds";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import type { RewardCard } from "../states/RewardCard";
import { RewardCardState } from "../states/RewardCard";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectCard, ObjectReward, WebFormOverlayRewardCardRecipients, WebFormOverlayRewardCardSenders, WebGlobalActionRedeem, WebGlobalActionReset, WebGlobalDetails, WebGlobalInProgress, WebGlobalStatus } from "../yaml8n";

function cardRedeemable (card: RewardCard): boolean {
	return card.invert || card.stampCount === card.stampGoal;
}

function cardSender (card: RewardCard): boolean {
	return card.senders.includes(`${AuthAccountState.data().id}`);
}

export function RewardCards (): m.Component {
	const state = {
		household: Stream(AuthAccountState.data().primaryAuthHouseholdID),
	};

	let cards: Stream<RewardCard[]>;

	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("RewardCards");

			cards = Stream.lift((cards, authHouseholdID) => {
				let filterCards: RewardCard[] = [];

				switch (m.route.param().filter) {
				case "sent":
					filterCards = RewardCardState.findSent(cards, m.route.param().to);
					break;
				case "inprogress":
					filterCards = RewardCardState.getInProgress(cards);
					break;
				case "redeemable":
					filterCards = RewardCardState.getRedeemable(cards);
					break;
				default:
					filterCards = cards;
				}

				if (AuthHouseholdState.data().length > 1) {
					filterCards = filterCards.filter((card) => {
						return card.authHouseholdID === authHouseholdID;
					});
				}

				return filterCards;
			}, RewardCardState.data, state.household);


			let filter = "";

			if (m.route.param().filter !== undefined) {
				filter = m.route.param().filter;
			}

			if (m.route.param().household === undefined) {
				m.route.param().household = state.household();
			} else {
				state.household(m.route.param().household);
			}

			AppState.setLayoutApp({
				...GetHelp("reward"),
				breadcrumbs: filter === "" || filter === "all" ?
					[
						{
							name: AuthAccountState.translate(ObjectReward),
						},
					] :
					[
						{
							link: "/reward/all",
							name: AuthAccountState.translate(ObjectReward),
						},
						{
							link: filter === "sent" && m.route.param().to !== undefined ?
								"/sent" :
								undefined,
							name: filter === "inprogress" ?
								AuthAccountState.translate(WebGlobalInProgress) :
								StringCapitalize(filter),
						},
					],
				toolbarActionButtons: [
					AppToolbarActions().newRewardCard,
				],
			});

			Telemetry.spanEnd("RewardCards");
		},
		onremove: (): void => {
			cards.end(true);
		},
		view: (): m.Children => {
			return [
				m(Title, {
					class: "RewardCards__title",
					loaded: RewardCardState.isLoaded(),
					tabs: TitleTabsAuthHousehold(),
				}),
				cards().length === 0 ?
					m(Form, {
						loaded: RewardCardState.isLoaded(),
					}, [
						m("i.RewardCards__empty-icon", Icons.NotFound),
						m("p.RewardCards__empty", "No Cards found"),
						m(Button, {
							icon: Icons.Add,
							name: `${AuthAccountState.translate(ActionNew)} ${AuthAccountState.translate(ObjectCard)}`,
							onclick: async (): Promise<void> => {
								return new Promise((resolve) => {
									AppState.setLayoutAppForm(FormOverlayRewardCard, RewardCardState.new());

									return resolve();
								});
							},
							permitted: GlobalState.permitted(PermissionComponentsEnum.Reward, true),
							primary: true,
							requireOnline: true,
						}),
					]) :
					cards()
						.map((card) => {
							return m(Form, {
								classes: [
									"RewardCards__form",
								],
								title: {
									buttonLeft: {
										disabled: true,
										icon: cardRedeemable(card) ?
											Icons.Redeemable :
											Icons.InProgress,
										iconOnly: true,
										name: AuthAccountState.translate(WebGlobalStatus),
										onclick: async () => {},
										permitted: true,
										requireOnline: false,
									},
									buttonRight:{
										icon: Icons.Edit,
										name: AuthAccountState.translate(ActionEdit),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												AppState.setLayoutAppForm(FormOverlayRewardCard, card);

												return resolve();
											});
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Reward, true) && cardSender(card) || GlobalState.permitted(PermissionComponentsEnum.Auth, true, state.household()),
										requireOnline: true,
									},
									name: card.name,
								},
							}, [
								m("div.RewardCards__card", [
									card.invert || card.details === "" ?
										[] :
										m("div.RewardCards__field", [
											m("p", AuthAccountState.translate(WebGlobalDetails)),
											m("p", card.details),
										]),
									m("div.RewardCards__field", [
										m("p", AuthAccountState.translate(ObjectReward)),
										m("p.RewardCards__reward", card.reward),
									]),
									m("div.RewardCards__field", [
										m("p", AuthAccountState.translate(WebFormOverlayRewardCardSenders)),
										m("p", card.senders.map((sender) => {
											return AuthHouseholdState.findMemberName(sender);
										})
											.join(", ")),
									]),
									card.recipients.length !== 1 || card.recipients.length === 1 && card.recipients[0] === AuthAccountState.data().id ?
										[] :
										m("div.RewardCards__field", [
											m("p", AuthAccountState.translate(WebFormOverlayRewardCardRecipients)),
											m("p", card.recipients.map((recipient) => {
												return AuthHouseholdState.findMemberName(recipient);
											})
												.join(", ")),
										]),
								]),
								m("div.RewardCards__stamps", {
									onclick: async () => {
										return RewardCardState.punch(card);
									},
								}, Array.from(Array(card.stampGoal)
									.keys())
									.map((num) => {
										if (!card.invert && num + 1 <= card.stampCount || card.invert && num + 1 <= card.stampGoal - card.stampCount) {
											return m("span.RewardCards__stamp.RewardCards__stamp--stamped");
										}

										return m("span.RewardCards__stamp");
									}),
								),
								m("div.RewardCards__buttons", [
									m(Button, {
										accent: true,
										name: AuthAccountState.translate(ActionDelete),
										onclick: async () => {
											return RewardCardState.delete(card.id);
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) || cardSender(card) && GlobalState.permitted(PermissionComponentsEnum.Reward, true),
										requireOnline: true,
									}),
									m(Button, {
										name: AuthAccountState.translate(WebGlobalActionReset),
										onclick: async () => {
											card.stampCount = 0;

											return RewardCardState.update(card);
										},
										permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) || cardSender(card) && GlobalState.permitted(PermissionComponentsEnum.Reward, true),
										requireOnline: true,
									}),
									m(Button, {
										name: AuthAccountState.translate(WebGlobalActionRedeem),
										onclick: async () => {
											return RewardCardState.delete(card.id);
										},
										permitted: !card.invert && card.stampCount === card.stampGoal && (GlobalState.permitted(PermissionComponentsEnum.Auth, true) || cardSender(card) && GlobalState.permitted(PermissionComponentsEnum.Reward, true)),
										primary: true,
										requireOnline: true,
									}),
								]),
							]);
						}),
			];
		},
	};
}
