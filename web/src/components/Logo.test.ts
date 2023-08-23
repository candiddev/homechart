import { Logo } from "./Logo";

describe("Logo", () => {
	test("full", async () => {
		testing.mount(Logo);

		const logo = testing.find("#homechart-logo");
		testing.text(logo, "Homechart");
		testing.hasAttribute(logo, "href", "https://homechart.app");
	});

	test("small", async () => {
		testing.mount(Logo, {
			link: "/home",
			noTitle: true,
			small: true,
		});

		const logo = testing.find("#homechart-logo");
		testing.text(logo, "");
		testing.hasAttribute(logo, "href", "#!/home");
		testing.hasClass(logo, "Logo--small");
	});

	test("no link", async () => {
		testing.mount(Logo, {
			noLink: true,
		});

		testing.find("p#homechart-logo");
	});
});
