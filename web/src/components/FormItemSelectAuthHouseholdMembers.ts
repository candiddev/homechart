import { FormItem } from "@lib/components/FormItem";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";

import { AuthHouseholdState } from "../states/AuthHousehold";

export interface FormItemSelectAuthHouseholdMembersAttrs {
	/** AuthHouseholdID for member lookup. */
	authHouseholdID: NullUUID,

	/** Disable the form input. */
	disabled?: boolean,

	/** A list of members that are selected. */
	members: (null | string)[],

	/** A list of member names that can be selected.  Defaults to all member names for the household ID. */
	memberNames?: string[],

	/** Can multiple members be selected? */
	multiple?: boolean,

	/** Name for the form label. */
	name: string,
	oninput(members: string | (null | string)[] | null): void,

	/** Tooltip for what the FormItem does. */
	tooltip: string,
}

export function FormItemSelectAuthHouseholdMembers (): m.Component<FormItemSelectAuthHouseholdMembersAttrs> {
	return {
		view: (vnode): m.Children => {
			return m(FormItem, {
				buttonArray: {
					onclick: (e): void => {
						if (vnode.attrs.disabled === true) {
							return;
						}
						const member = AuthHouseholdState.findMember(e);
						const members = Clone(vnode.attrs.members);
						const index = members.indexOf(`${member.id}`);

						if (vnode.attrs.multiple === true) {
							if (index < 0) {
								members.push(`${member.id}`);
							} else {
								members.splice(index, 1);
							}

							vnode.attrs.oninput(members);
						} else {
							vnode.attrs.oninput(member.id === vnode.attrs.members[0] ?
								null :
								member.id);
						}
					},
					selected: () => {
						return vnode.attrs.members.map((member) => {
							return AuthHouseholdState.findMemberName(member);
						});
					},
					value: vnode.attrs.memberNames === undefined ?
						AuthHouseholdState.findMemberNames(vnode.attrs.authHouseholdID) :
						vnode.attrs.memberNames,
				},
				name: vnode.attrs.name,
				tooltip: vnode.attrs.tooltip,
			});
		},
	};
}
