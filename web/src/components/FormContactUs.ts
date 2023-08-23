import "./FormContactUs.css";

import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { AppState } from "@lib/states/App";
import { ActionCancel, Help } from "@lib/yaml8n";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { CloudHouseholdState } from "../states/CloudHousehold";
import { ContactState } from "../states/Contact";
import { InfoState } from "../states/Info";
import { WebFormContactUsButtonFeedback, WebFormContactUsEmailAddressTooltip, WebFormContactUsFooter, WebFormContactUsMessage, WebFormContactUsMessageTooltip, WebFormContactUsTitle, WebGlobalActionSend, WebGlobalEmailAddress } from "../yaml8n";

export function FormContactUs (): m.Component {
	const state = {
		contact: ContactState.new(),
		formVisible: false,
	};
	return {
		oninit: (): void => {
			state.contact = {
				...ContactState.new(),
				...{
					emailAddress: AuthAccountState.data().emailAddress,
				},
			};
		},
		view: (): m.Children => {
			return InfoState.data().cloud || ! CloudHouseholdState.isExpired() ?
				AppState.isSessionAuthenticated() && ! m.route.get()
					.includes("/sign") ?
					m("div", {
						style: {
							"align-self": "center",
						},
					}, m(Form, {
						buttons: [
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.formVisible = false;

										return resolve();
									});
								},
								permitted: state.formVisible,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(WebGlobalActionSend),
								permitted: state.formVisible,
								requireOnline: true,
								submit: true,
							},
							{
								accent: true,
								name: AuthAccountState.translate(Help),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										if (state.contact.type === 0 && state.formVisible) {
											state.formVisible = false;
										}
										state.formVisible = true;
										state.contact.type = 0;

										return resolve();
									});
								},
								permitted: !state.formVisible,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(WebFormContactUsButtonFeedback),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										if (state.contact.type === 1 && state.formVisible) {
											state.formVisible = false;
										}
										state.formVisible = true;
										state.contact.type = 1;

										return resolve();
									});
								},
								permitted: !state.formVisible,
								requireOnline: true,
								secondary: true,
							},
						],
						onsubmit: async () => {
							return ContactState.create(state.contact)
								.then(() => {
									state.formVisible = false;
								});
						},
						title: {
							name: AuthAccountState.translate(WebFormContactUsTitle),
						},
					}, state.formVisible ?
						[
							m(FormItem, {
								input: {
									oninput: (e: string): void => {
										state.contact.emailAddress = e;
									},
									type: "email",
									value: state.contact.emailAddress,
								},
								name: AuthAccountState.translate(WebGlobalEmailAddress),
								tooltip: AuthAccountState.translate(WebFormContactUsEmailAddressTooltip),
							}),
							m(FormItem, {
								name: AuthAccountState.translate(WebFormContactUsMessage),
								textArea: {
									oninput: (e: string): void => {
										state.contact.message = e;
									},
									value: state.contact.message,
								},
								tooltip: AuthAccountState.translate(WebFormContactUsMessageTooltip),
							}),
						] :
						[],
					)) :
					m("p.Form__support", {
						id: "support",
					}, [
						AuthAccountState.translate(WebFormContactUsFooter),
						m("a.GlobalLink", {
							href: "mailto:support@homechart.app",
						}, m("span", "support@homechart.app")),
					]) :
				[];
		},
	};
}
