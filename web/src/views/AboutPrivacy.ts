import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { AppState } from "@lib/states/App";
import m from "mithril";

import { GetHelp } from "../utilities/GetHelp";

const privacy = [
	{
		content: `When registering for Homechart we ask for information such as your name and email address. Your information is only used internally and won't be shared with others.

Homechart collects the email addresses of those who communicate with us via email, and information submitted through voluntary activities such as site registrations or participation in surveys. Homechart also collects aggregated, anonymous user data regarding app usage. The user data we collect is used to improve Homechart and the quality of our service. We only collect personal data that is required to provide our services, and we only store it insofar that it is necessary to deliver these services.`,
		header: "Information gathering and usage",
	},
	{
		content: "Homechart uses third party vendors and hosting partners to provide the necessary hardware, software, networking, storage, and related technology required to run Homechart. Although Homechart owns the code, databases, and all rights to the Homechart application, you retain all rights to your data. We will never share your personal data with a third party without your prior authorization, and we will never sell data to third parties. We process data within the United States of America.",
		header: "Your data",
	},
	{
		content: "We only use cookies to store authentication and session information. Acceptance of cookies is required to use Homechart.",
		header: "Cookies",
	},
	{
		content: "We do not partner with or have special relationships with any ad server companies.",
		header: "Ad servers",
	},
	{
		content: "All data and information transmitted with Homechart is secured by TLS encryption.",
		header: "Security",
	},
	{
		content: "If our information practices change at some time in the future, we will post the policy changes to our Web site to notify you of these changes.  We willl also use for these new purposes only data collected from the time of the policy change forward. If you are concerned about how your information is used, you should check back at our Web site periodically.",
		header: "Changes",
	},
];

export function AboutPrivacy (): m.Component {
	return {
		oninit: (): void => {
			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [
					{
						name: "About",
					},
					{
						name: "Privacy Policy",
					},
				],
				toolbarActionButtons: [],
			});
		},
		view: (): m.Children => {
			return m(Form, {
				title: {
					name: "Homechart Privacy Policy",
					subtitles: [
						{
							key: "Effective Date:",
							value: "2019-12-01",
						},
						{
							key: "Last Updated:",
							value: "2021-08-19",
						},
					],
				},
			}, privacy.map((section) => {
				return m(FormItem, {
					name: section.header,
					textArea: {
						disabled: true,
						value: section.content,
					},
					tooltip: "",
				});
			}));
		},
	};
}
