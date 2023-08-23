import seed from "../jest/seed";
import type { Notification } from "../states/Notification";
import { NotificationState } from "../states/Notification";
import { AdminNotifications } from "./AdminNotifications";

NotificationState.read = async (): Promise<Notification[]> => {
	return new Promise((resolve): void => {
		resolve([
			{
				...NotificationState.new(),
				...{
					authAccountID: seed.authAccounts[0].id,
					created: "2019-01-01T12:00:00.000Z",
					id: "1",
					sendAfter: "2019-01-01T12:00:00.000Z",
					subjectSMTP: "test1",
					type: 2,
				},
			},
			{
				...NotificationState.new(),
				...{
					authAccountID: seed.authAccounts[0].id,
					created: "2019-01-01T12:00:00.000Z",
					id: "2",
					sendAfter: "2019-01-01T13:00.000Z",
					subjectSMTP: "test2",
					type: 3,
				},
			},
		]);
	});
};

test("AdminNotification", async () => {
	testing.mount(AdminNotifications);
	await testing.sleep(100);
	testing.redraw();
	testing.title("Admin - Notifications");
	testing.findAll("tbody tr", 2);
	testing.text("#table-data-1-authaccountid", seed.authAccounts[0].id);
	testing.text("#table-data-1-subjectsmtp", "test1");
	testing.text("#table-data-1-created", "01/01/2019");
	testing.text("#table-data-1-sendafter", "01/01/2019");
	testing.click("#table-row_1");
	testing.find("#form-item-input-authaccountid");
	testing.find("#form-item-input-to-smtp");
	testing.find("#form-item-input-subject-smtp");
	testing.find("#form-item-text-area-body-smtp");
	testing.find("#form-item-input-send-after");
});
