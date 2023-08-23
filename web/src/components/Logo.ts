import "./Logo.css";

import { AppState } from "@lib/states/App";
import { SetClass } from "@lib/utilities/SetClass";
import m from "mithril";

import HomechartDark from "../images/homechart_dark.png?format=webp";
import HomechartLight from "../images/homechart_light.png?format=webp";

interface LogoAttrs {
	link?: string,
	noLink?: boolean,
	noTitle?: boolean,
	small?: boolean,
}

export function Logo (): m.Component<LogoAttrs> {
	const prefix = location.hostname.includes("dev") ?
		"dev." :
		location.hostname.includes("stg") ?
			"stg." :
			"";

	return {
		view: (vnode): m.Children => {
			return m(vnode.attrs.link === undefined ?
				vnode.attrs.noLink === true ?
					"p" as any : // eslint-disable-line @typescript-eslint/no-explicit-any
					"a" as any : // eslint-disable-line @typescript-eslint/no-explicit-any
				m.route.Link, {
				class: SetClass({
					"Logo": true,
					"Logo--small": vnode.attrs.small === true,
				}),
				href: vnode.attrs.link === undefined ?
					vnode.attrs.noLink === true ?
						undefined :
						`https://${prefix}homechart.app` :
					vnode.attrs.link,
				id: "homechart-logo",
				rel: vnode.attrs.link === undefined ?
					"noopener" :
					undefined,
				target: vnode.attrs.link === undefined ?
					"_blank" :
					undefined,
			}, [
				m("img.Logo__img", {
					alt: "Homechart",
					src: AppState.preferences().darkMode ?
						HomechartDark :
						HomechartLight, /* TODO change this and the logo getComputedStyle(document.getElementById("app") as Element)
						.getPropertyValue("--color_primary-content")
						.endsWith("101010") ?
						HomechartDark :
						HomechartLight, */
				}),
				vnode.attrs.noTitle === true ?
					[] :
					m("p.Logo__name", "Homechart"),
			]);
		},
	};
}
