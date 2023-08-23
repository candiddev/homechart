import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { AppState } from "@lib/states/App";
import m from "mithril";

import { GetHelp } from "../utilities/GetHelp";

interface HelpTopic {
	content: string,
	title: string,
}

const topics: HelpTopic[] = [
	{
		content: "Markdown can make text **bold** by adding `**` around word(s) and _italic_ by using `_`.  Combine both to get **_bold and italic_**",
		title: "Text Formatting",
	},
	{
		content: "Markdown can create links by entering text as `[Link Name](http://www.example.com)`: [Homechart](https://homechart.app).  Homechart also supports smart links, which can be used to link to Accounts, Recipes, and more.  Smart links can be created by entering `#` and selecting the type and item from the drop downs.  A smart link looks like `#type/itemID`",
		title: "Links",
	},
	{
		content: `Markdown can create headings by starting a line with \`#\`.  The number of \`#s\` indicate the type of heading, up to six can be used: 

# Heading 1
Some other content

## Heading 2
Some other content

### Heading 3
Some other content

#### Heading 4
Some other content

##### Heading 5
Some other content

###### Heading 6
Some other content
`,
		title: "Headings",
	},
	{
		content: `Markdown can make different kinds of lists.  You can use numbers to create an ordered list:

1. Item 1
    1. Item 1a
    2. Item 1b
2. Item 2
3. Item 3

Or \`-\` and \`*\` to create an unordered list:

* Item 1
    * Item 1a
    * Item 1b
* Item 2
* Item 3

List levels need to be indented **four** spaces.`,
		title: "Lists",
	},
	{
		content: `Markdown can easily create tables:

| Header 1 | Header 2 | Header 3 |
|-|-|-|
| Item 1 | Item 2 | Item 3 |
| Item 4 | Item 5 | Item 6 |`,
		title: "Tables",
	},
];

export function HelpMarkdown (): m.Component {
	return {
		oninit: async (): Promise<void> => {
			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [
					{
						name: "Markdown Help",
					},
				],
				toolbarActionButtons: [],
			});
		},
		view: (): m.Children => {
			return m(Form, {
				title: {
					name: "Markdown Playground",
				},
			}, topics.map((topic) => {
				return m(FormItem, {
					name: topic.title,
					textArea: {
						oninput: (e: string): void => {
							topic.content = e;
						},
						value: topic.content,
					},
					tooltip: "",
				});
			}),
			);
		},
	};
}
