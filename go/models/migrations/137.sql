ALTER TABLE auth_session DROP COLUMN platform;

ALTER TABLE auth_session ADD COLUMN user_agent TEXT NOT NULL DEFAULT '';
