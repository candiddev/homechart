import { NotificationState } from "./Notification";

describe("NotificationState", () => {
	test("create", async () => {
		testing.mocks.responses = [
			{},
		];

		const n = NotificationState.new();

		await NotificationState.create(n);

		testing.requests([
			{
				body: n,
				method: "POST",
				path: "/api/v1/notifications",
			},
		]);
	});

	test("delete", async () => {
		testing.mocks.responses = [
			{},
		];

		await NotificationState.delete("1");

		testing.requests([
			{
				method: "DELETE",
				path: "/api/v1/notifications/1",
			},
		]);
	});

	test("read", async () => {
		testing.mocks.responses = [
			{
				dataType: "Notifications",
				dataValue: [
					NotificationState.new(),
					NotificationState.new(),
				],
			},
		];

		const notifications = await NotificationState.read();

		testing.requests([
			{
				method: "GET",
				path: "/api/v1/notifications",
			},
		]);

		expect(notifications)
			.toHaveLength(2);
	});

	test("update", async () => {
		testing.mocks.responses = [
			{},
		];

		const notification = {
			...NotificationState.new(),
			...{
				id: "1",
			},
		};

		await NotificationState.update(notification);

		testing.requests([
			{
				body: notification,
				method: "PUT",
				path: "/api/v1/notifications/1",
			},
		]);
	});
});
