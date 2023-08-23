ALTER TABLE auth_household
	DROP COLUMN cloud_push_notifications;

ALTER TABLE auth_session
	ADD COLUMN web_push JSONB;

ALTER TABLE auth_session
	DROP COLUMN fcm_token;

ALTER TABLE notification
	ADD COLUMN actions JSONB;

ALTER TABLE notification
	DROP COLUMN action;

ALTER TABLE notification
	RENAME COLUMN body_fcm TO body_web_push;

ALTER TABLE notification
	RENAME COLUMN subject_fcm TO subject_web_push;

ALTER TABLE notification
	DROP COLUMN to_fcm;

ALTER TABLE notification
	ADD COLUMN to_web_push JSONB;
