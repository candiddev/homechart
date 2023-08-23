import m from "mithril";

export function Payment (): m.Component {
	return {
		oninit: (): void => {
			const e = document.createElement("script");
			e.src = "https://cdn.paddle.com/paddle/paddle.js";
			e.onload = (): void => {
				const vendor = parseInt(m.route.param().vendor);

				if (! isNaN(vendor)) {
					Paddle.Setup({
						vendor: vendor,
					});

					if (m.route.param().sandbox !== undefined) {
						Paddle.Environment.set("sandbox");
					}

					let redirect = "";

					if (m.route.param().redirect !== undefined && m.route.param().redirect !== "") {
						redirect = m.route.param().redirect;
					}

					const product = parseInt(m.route.param().product);

					if (! isNaN(product)) {
						Paddle.Checkout.open({
							closeCallback: () => {
								window.location.pathname = "/subscription";
							},
							email: m.route.param().email,
							passthrough: m.route.param().id,
							product: product,
							success: redirect,
						});
					}
				}

			};

			document.head.appendChild(e);
		},
		view: (): m.Children => {
			return m("div");
		},
	};
}
