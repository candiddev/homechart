ALTER TABLE auth_account
	RENAME COLUMN collapsed_wiki_pages TO collapsed_notes_pages;
ALTER TABLE auth_account
	RENAME COLUMN last_id_wiki_page TO last_id_notes_page;
ALTER TABLE auth_household
	RENAME COLUMN last_id_wiki_page TO last_id_notes_page;

ALTER TABLE wiki_page
	RENAME TO notes_page;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_auth_account_household TO notes_page_auth_account_household;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_name_check TO notes_page_name_check;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_name_length TO notes_page_name_length;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_short_id_check TO notes_page_short_id_check;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_auth_account_id_fkey TO notes_page_auth_account_id_fkey;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_auth_household_id_fkey TO notes_page_auth_household_id_fkey;
ALTER TABLE notes_page
	RENAME CONSTRAINT wiki_page_parent_id_fkey TO notes_page_parent_id_fkey;

ALTER TABLE cook_recipe
	RENAME COLUMN cook_schedule_count TO cook_meal_plan_count;
ALTER TABLE cook_recipe
	RENAME COLUMN cook_schedule_last TO cook_meal_plan_last;

ALTER TABLE cook_meal
	RENAME TO cook_meal_time;
ALTER TABLE cook_meal_time
	RENAME CONSTRAINT cook_meal_auth_household_id_fkey TO cook_meal_time_auth_household_id_fkey;
ALTER TABLE cook_meal_time
	RENAME CONSTRAINT cook_meal_auth_household_id_id_key TO cook_meal_time_auth_household_id_id_fkey;
ALTER TABLE cook_meal_time
	RENAME CONSTRAINT cook_meal_auth_household_id_name_key TO cook_meal_time_auth_household_id_name_fkey;

ALTER TABLE cook_schedule
	RENAME TO cook_meal_plan;
ALTER TABLE cook_meal_plan
	RENAME COLUMN cook_meal_id TO cook_meal_time_id;
ALTER TABLE cook_meal_plan
	RENAME CONSTRAINT cook_schedule_auth_household_id_cook_meal_id_fkey TO cook_meal_plan_auth_household_id_cook_meal_time_id_fkey;
ALTER TABLE cook_meal_plan
	RENAME CONSTRAINT cook_schedule_auth_household_id_cook_recipe_id_fkey TO
	cook_meal_plan_auth_household_id_cook_recipe_id_fkey;
ALTER TABLE cook_meal_plan
	RENAME CONSTRAINT cook_schedule_auth_household_id_fkey TO
	cook_meal_plan_auth_household_id_fkey;

ALTER TABLE plan_project
	DROP COLUMN hidden;

ALTER TABLE wiki_page_version
	RENAME TO notes_page_version;
ALTER TABLE notes_page_version
	RENAME COLUMN wiki_page_id TO notes_page_id;
ALTER TABLE notes_page_version
	RENAME CONSTRAINT wiki_content_body_length TO notes_content_body_length;
ALTER TABLE notes_page_version
	RENAME CONSTRAINT wiki_page_version_wiki_page_id_fkey TO notes_page_version_notes_page_id_fkey;

ALTER INDEX cook_meal_pkey
	RENAME TO cook_meal_time_pkey;
ALTER INDEX cook_meal_auth_household_id_fkey
	RENAME TO cook_meal_time_auth_household_id_fkey;
ALTER INDEX cook_meal_updated
	RENAME TO cook_meal_time_updated;

ALTER INDEX cook_schedule_pkey
	RENAME TO cook_meal_plan_pkey;
ALTER INDEX cook_schedule_auth_household_id_fkey
	RENAME TO cook_meal_plan_auth_household_id_fkey;
ALTER INDEX cook_schedule_cook_recipe_id
	RENAME TO cook_meal_plan_cook_recipe_id;
ALTER INDEX cook_schedule_date
	RENAME TO cook_meal_plan_date;
ALTER INDEX cook_schedule_updated
	RENAME TO cook_meal_plan_updated;

ALTER INDEX wiki_page_pkey
	RENAME TO notes_page_pkey;
ALTER INDEX wiki_page_auth_account
	RENAME TO notes_page_auth_account;
ALTER INDEX wiki_page_auth_account_parent_id_name
	RENAME TO notes_page_auth_account_parent_id_name;
ALTER INDEX wiki_page_auth_account_short_id
	RENAME TO notes_page_auth_account_short_id;
ALTER INDEX wiki_page_auth_household
	RENAME TO notes_page_auth_household;
ALTER INDEX wiki_page_auth_household_parent_id_name
	RENAME TO notes_page_auth_household_parent_id_name;
ALTER INDEX wiki_page_auth_household_short_id
	RENAME TO notes_page_auth_household_short_id;
ALTER INDEX wiki_page_updated
	RENAME TO notes_page_updated;
ALTER INDEX wiki_page_version_pkey
	RENAME TO notes_page_version_pkey;
ALTER INDEX wiki_page_version_updated
	RENAME TO notes_page_version_updated;
ALTER INDEX wiki_page_version_wiki_page
	RENAME TO notes_page_version_wiki_page;

DROP TRIGGER IF EXISTS ad_auth_account ON notes_page;
DROP TRIGGER IF EXISTS ad_auth_household ON notes_page;
DROP TRIGGER IF EXISTS ai_auth_account ON notes_page;
DROP TRIGGER IF EXISTS ai_auth_household ON notes_page;
DROP TRIGGER IF EXISTS au_auth_account ON notes_page;
DROP TRIGGER IF EXISTS au_auth_household ON notes_page;
DROP TRIGGER IF EXISTS bi_wiki_page_parent_id ON notes_page;
DROP TRIGGER IF EXISTS bi_wiki_page_short_id ON notes_page;
DROP TRIGGER IF EXISTS bu_wiki_page_parent_id ON notes_page;
DROP TRIGGER IF EXISTS bu_wiki_page_short_id ON notes_page;

DROP TRIGGER IF EXISTS ad_cook_meal_notify ON cook_meal_time;
DROP TRIGGER IF EXISTS ai_cook_meal_notify ON cook_meal_time;
DROP TRIGGER IF EXISTS au_cook_meal_notify ON cook_meal_time;

DROP TRIGGER IF EXISTS ad_cook_recipe ON cook_meal_plan;
DROP TRIGGER IF EXISTS ai_cook_recipe ON cook_meal_plan;
DROP TRIGGER IF EXISTS au_cook_recipe ON cook_meal_plan;

DROP FUNCTION IF EXISTS wiki_page_copy_parent_id;
DROP FUNCTION IF EXISTS wiki_page_set_short_id;
DROP FUNCTION IF EXISTS wiki_page_update_auth_account;
DROP FUNCTION IF EXISTS wiki_page_update_auth_household;
