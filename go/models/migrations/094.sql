CREATE TABLE auth_household (
	  id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, subscription_customer_id TEXT NOT NULL DEFAULT ''
	, subscription_expires DATE NOT NULL
	, subscription_last_transaction_id TEXT NOT NULL DEFAULT ''
	, subscription_processor SMALLINT NOT NULL DEFAULT 0
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, notified_expiring BOOLEAN DEFAULT false
	, notified_expired BOOLEAN DEFAULT false
	, last_id_auth_account INT NOT NULL DEFAULT 0
	, last_id_budget_account INT NOT NULL DEFAULT 0
	, last_id_cook_recipe INT NOT NULL DEFAULT 0
	, last_id_plan_project INT NOT NULL DEFAULT 0
	, last_id_plan_task INT NOT NULL DEFAULT 0
	, last_id_wiki_page INT NOT NULL DEFAULT 0
	, last_id_budget_category INT NOT NULL DEFAULT 0
	, last_id_budget_payee INT NOT NULL DEFAULT 0
	, preferences JSONB
	, last_id_inventory_item INT NOT NULL DEFAULT 0
	, last_id_inventory_view INT NOT NULL DEFAULT 0
	, last_id_reward_card INT NOT NULL DEFAULT 0
	, subscription_referral_code TEXT UNIQUE NOT NULL
	, subscription_referrer_code TEXT NOT NULL DEFAULT ''
	, backup_encryption_key TEXT NOT NULL DEFAULT ''
	, cloud_connected BOOLEAN NOT NULL DEFAULT false
	, self_hosted_id UUID UNIQUE
	, subscription_id TEXT NOT NULL DEFAULT ''
	, last_id_bookmark INT NOT NULL DEFAULT 0
	, self_hosted_url TEXT NOT NULL DEFAULT ''
	, feature_votes JSONB NOT NULL DEFAULT '[]'

	, CONSTRAINT subscription_customer_id_length CHECK (CHAR_LENGTH(subscription_customer_id) <= 200)
	, CONSTRAINT subscription_last_transaction_id_length CHECK (CHAR_LENGTH(subscription_last_transaction_id) <= 200)
	, CONSTRAINT auth_household_subscription_referral_code_check CHECK (subscription_referral_code <> '')
	, CONSTRAINT subscription_referrer_code CHECK (subscription_referrer_code <> subscription_referral_code)
	, CONSTRAINT self_hosted_url CHECK (CHAR_LENGTH(self_hosted_url) <= 200)
);

CREATE INDEX auth_household_subscription_expires
	ON auth_household USING BRIN (subscription_expires);
CREATE INDEX auth_household_self_hosted_id
	ON auth_household (self_hosted_id);
CREATE INDEX auth_household_updated
	ON auth_household USING BRIN (updated);

CREATE TABLE auth_account (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, verification_token UUID
	, password_reset_token UUID
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, password_reset_expires TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, tos_accepted BOOLEAN NOT NULL DEFAULT false
	, totp_enabled BOOLEAN NOT NULL DEFAULT false
	, verified BOOLEAN NOT NULL DEFAULT false
	, email_address TEXT NOT NULL UNIQUE
	, password_hash TEXT NOT NULL DEFAULT ''
	, totp_backup TEXT NOT NULL DEFAULT ''
	, totp_secret TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL DEFAULT ''
	, oidc_id TEXT NOT NULL DEFAULT ''
	, oidc_provider_type SMALLINT NOT NULL DEFAULT 0
	, last_id_plan_project INT NOT NULL DEFAULT 0
	, last_id_plan_task INT NOT NULL DEFAULT 0
	, short_id INT NOT NULL DEFAULT 0
	, collapsed_plan_projects TEXT[]
	, collapsed_plan_tasks TEXT[]
	, collapsed_wiki_pages TEXT[]
	, last_id_wiki_page INT NOT NULL DEFAULT 0
	, preferences JSONB
	, permissions JSONB NOT NULL DEFAULT '{}'
	, last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_date
	, child BOOL NOT NULL DEFAULT false
	, calendar_event_color SMALLINT NOT NULL DEFAULT 0 CHECK (calendar_event_color >= 0)
	, hide_home_components TEXT[]
	, daily_agenda_next TIMESTAMP WITH TIME ZONE
	, daily_agenda_notified BOOLEAN NOT NULL DEFAULT false
	, daily_agenda_time TIME NOT NULL DEFAULT '00:00'
	, time_zone TEXT NOT NULL DEFAULT 'UTC' CHECK (time_zone <> '')
	, setup BOOLEAN NOT NULL DEFAULT false
	, last_id_bookmark INT NOT NULL DEFAULT 0

	, CONSTRAINT auth_account_name CHECK (CHAR_LENGTH(name) <= 200)
	, CONSTRAINT password_hash_length CHECK (CHAR_LENGTH(password_hash) <= 100)
	, CONSTRAINT totp_backup_length CHECK (CHAR_LENGTH(totp_backup) <= 50)
	, CONSTRAINT totp_secret_length CHECK (CHAR_LENGTH(totp_secret) <= 50)
	, constraint auth_account_email_address CHECK (email_address <> '')
	, constraint auth_account_oidc_password_hash CHECK ((oidc_id = '' AND oidc_provider_type = 0 AND password_hash != '') OR (oidc_id != '' AND oidc_provider_type != 0 AND password_hash = '') OR (oidc_id != '' AND oidc_provider_type != 0 AND password_hash != ''))
	, CONSTRAINT auth_account_oidc_id_length CHECK (CHAR_LENGTH(oidc_id) <= 100)
	, CONSTRAINT auth_account_short_id UNIQUE (auth_household_id, short_id)
	, CONSTRAINT oidc_provider_type_value CHECK (
		oidc_provider_type >= 0
		AND oidc_provider_type <= 3
	)

	, UNIQUE (auth_household_id, id)
);

CREATE INDEX auth_account_auth_household_id_fkey
	ON auth_account (auth_household_id);
CREATE INDEX auth_account_updated
	ON auth_account USING BRIN (updated);
CREATE INDEX auth_account_verified
	ON auth_account (verified);
CREATE INDEX auth_account_oidc_provider_id
	ON auth_account (oidc_provider_type, oidc_id);
CREATE INDEX auth_account_daily_agenda_time
	ON auth_account USING brin (daily_agenda_time);

CREATE TABLE auth_session (
	  id UUID PRIMARY KEY
	, auth_account_id UUID NOT NULL
	, auth_household_id UUID NOT NULL
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, expires TIMESTAMP WITH TIME ZONE
	, admin BOOLEAN NOT NULL DEFAULT false
	, permissions JSONB NOT NULL DEFAULT '{}'
	, fcm_token TEXT NOT NULL DEFAULT ''
	, key UUID NOT NULL UNIQUE
	, name TEXT NOT NULL DEFAULT ''
	, platform SMALLINT NOT NULL DEFAULT 0 CHECK (platform >= 0)
	
	, CONSTRAINT auth_session_fcm_token_length CHECK (CHAR_LENGTH(fcm_token) <= 200)
	, CONSTRAINT auth_session_name CHECK (CHAR_LENGTH(name) <= 200)

	, FOREIGN KEY (auth_account_id, auth_household_id) REFERENCES auth_account (id, auth_household_id) ON DELETE CASCADE
);

CREATE INDEX auth_session_auth_account_id_fkey
	ON auth_session (auth_account_id);
CREATE INDEX auth_session_expires
	ON auth_session USING BRIN (expires);

CREATE TABLE cook_recipe (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, deleted TIMESTAMP WITH TIME ZONE
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, cook_schedule_last DATE
	, cook_schedule_count INT NOT NULL DEFAULT 0
	, time_cook INT NOT NULL DEFAULT 0
	, time_prep INT NOT NULL DEFAULT 0
	, difficulty SMALLINT NOT NULL DEFAULT 0
	, rating SMALLINT NOT NULL DEFAULT 0
	, public BOOLEAN NOT NULL DEFAULT false
	, directions TEXT NOT NULL DEFAULT ''
	, image TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL CHECK (name <> '')
	, servings TEXT NOT NULL DEFAULT ''
	, source TEXT NOT NULL DEFAULT ''
	, tags TEXT[]
	, ingredients TEXT NOT NULL DEFAULT ''
	, short_id INT NOT NULL DEFAULT 0
	, notes JSONB
	
	, CONSTRAINT difficult CHECK (0 <= difficulty AND difficulty <= 5)
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT rating CHECK (0 <= rating AND rating <= 5)
	, CONSTRAINT servings_length CHECK (CHAR_LENGTH(servings) <= 500)
	, CONSTRAINT cook_recipe_directions_length CHECK (char_length(directions) <= 5000)
	, CONSTRAINT cook_recipe_image_length CHECK (CHAR_LENGTH(image) <= 500000)
	, CONSTRAINT cook_recipe_ingredients_length CHECK (CHAR_LENGTH(ingredients) <= 5000)
	, CONSTRAINT cook_recipe_servings_length CHECK (CHAR_LENGTH(servings) <= 500)
	, CONSTRAINT cook_recipe_short_id UNIQUE (auth_household_id, short_id)
	, CONSTRAINT cook_recipe_source_length CHECK (CHAR_LENGTH(source) <= 500)

	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX cook_recipe_auth_household_id_fkey
	ON cook_recipe (auth_household_id);
CREATE INDEX cook_recipe_updated
	ON cook_recipe USING BRIN (updated);

CREATE TABLE cook_meal (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, time TIME NOT NULL
	, name TEXT NOT NULL CHECK (name <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, CONSTRAINT name CHECK (CHAR_LENGTH(name) <= 500)
	
	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

create index cook_meal_auth_household_id_fkey
	ON cook_meal (auth_household_id);
CREATE INDEX cook_meal_updated
	ON cook_meal USING BRIN (updated);

CREATE TABLE cook_schedule (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, cook_meal_id UUID NOT NULL
	, cook_recipe_id UUID
	, id UUID PRIMARY KEY
	, date DATE NOT NULL
	, time TIME NOT NULL
	, cook_recipe_scale TEXT NOT NULL DEFAULT ''
	, custom_recipe TEXT NOT NULL DEFAULT ''
	, notification_time_cook TIMESTAMP WITH TIME ZONE
	, notification_time_prep TIMESTAMP WITH TIME ZONE
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, auth_account_id UUID
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
	
	, CONSTRAINT cook_recipe_scale_length CHECK (CHAR_LENGTH(cook_recipe_scale) <= 50)
	, CONSTRAINT custom_recipe_length CHECK (CHAR_LENGTH(custom_recipe) <= 500)
	, CONSTRAINT cook_recipe_custom_recipe CHECK ((cook_recipe_id IS NULL) != (custom_recipe = '')) /* only one column can have a value */

	, FOREIGN KEY (auth_household_id, cook_meal_id) REFERENCES cook_meal (auth_household_id, id) ON DELETE CASCADE
	, FOREIGN KEY (auth_household_id, cook_recipe_id) REFERENCES cook_recipe (auth_household_id, id) ON DELETE CASCADE
);

CREATE INDEX cook_schedule_auth_household_id_fkey
	ON cook_schedule (auth_household_id);
CREATE INDEX cook_schedule_cook_recipe_id
	ON cook_schedule (cook_recipe_id);
CREATE INDEX cook_schedule_date
	ON cook_schedule USING BRIN (date);
CREATE INDEX cook_schedule_updated
	ON cook_schedule USING BRIN (updated);

CREATE TABLE budget_account (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, budget_transaction_amount BIGINT NOT NULL DEFAULT 0
	, budget_transaction_amount_cleared BIGINT NOT NULL DEFAULT 0
	, budget_transaction_amount_reconciled BIGINT NOT NULL DEFAULT 0
	, name TEXT NOT NULL CHECK (name <> '')
	, hidden BOOLEAN NOT NULL DEFAULT false
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, short_id INT NOT NULL DEFAULT 0
	, icon TEXT NOT NULL DEFAULT ''
	
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT budget_account_short_id UNIQUE (auth_household_id, short_id)
	, CONSTRAINT icon_length CHECK (CHAR_LENGTH(icon) <= 100)
	
	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX budget_account_auth_household_id_fkey
	ON budget_account (auth_household_id);
CREATE INDEX budget_account_updated
	ON budget_account USING BRIN (updated);

CREATE TABLE budget_category (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, budget_transaction_amount BIGINT NOT NULL DEFAULT 0
	, target_amount BIGINT DEFAULT 0
	, target_month SMALLINT NOT NULL DEFAULT 0
	, target_year INT NOT NULL DEFAULT 0
	, header TEXT NOT NULL DEFAULT ''
	, income BOOLEAN NOT NULL DEFAULT false
	, name TEXT NOT NULL CHECK (name <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, short_id INT NOT NULL DEFAULT 0
	, budget_month_category_amount BIGINT NOT NULL DEFAULT 0
	
	, CONSTRAINT header_length CHECK (CHAR_LENGTH(header) <= 500)
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT budget_category_goal_month_check CHECK (0 <= target_month AND target_month < 13)

	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX budget_category_auth_household_id_fkey
	ON budget_category (auth_household_id);
CREATE INDEX budget_category_updated
	ON budget_category USING BRIN (updated);

CREATE TABLE budget_month (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, budget_month_category_amount BIGINT NOT NULL DEFAULT 0
	, budget_transaction_amount_income BIGINT NOT NULL DEFAULT 0
	, year_month INT NOT NULL CHECK (year_month <> 0)
	
	, PRIMARY KEY (auth_household_id, year_month)
);

CREATE INDEX budget_month_auth_household_id_fkey
	ON budget_month(auth_household_id);
CREATE INDEX budget_month_year_month
	ON budget_month(year_month);

CREATE TABLE budget_month_category (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, budget_category_id UUID NOT NULL
	, amount BIGINT NOT NULL DEFAULT 0
	, budget_transaction_amount BIGINT NOT NULL DEFAULT 0
	, year_month INT NOT NULL CHECK (year_month <> 0)
	, created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL

	, FOREIGN KEY (auth_household_id, budget_category_id) REFERENCES budget_category (auth_household_id, id) ON DELETE CASCADE
	
	, PRIMARY KEY (auth_household_id, budget_category_id, year_month)
);

CREATE INDEX budget_month_category_auth_household_id_fkey
	ON budget_month_category(auth_household_id);
CREATE INDEX budget_month_category_year_month
	ON budget_month_category (year_month);
CREATE INDEX budget_month_category_budget_category_id
	ON budget_month_category (budget_category_id);

CREATE TABLE budget_payee (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, budget_category_id UUID
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, budget_transaction_amount BIGINT NOT NULL DEFAULT 0
	, name TEXT NOT NULL CHECK (name <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, address TEXT NOT NULL DEFAULT ''
	, shop_store BOOL NOT NULL DEFAULT false
	, short_id INT NOT NULL DEFAULT 0
	, icon TEXT NOT NULL DEFAULT ''

	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT address_length CHECK (CHAR_LENGTH(address) <= 500)
	, CONSTRAINT icon_length CHECK (CHAR_LENGTH(icon) <= 100)

	, FOREIGN KEY (budget_category_id) REFERENCES budget_category (id) ON DELETE SET NULL

	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX budget_payee_auth_household_id_fkey
	ON budget_payee (auth_household_id);
CREATE INDEX budget_payee_updated
	ON budget_payee USING BRIN (updated);

CREATE TABLE budget_recurrence (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, budget_account_id UUID NOT NULL
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, template JSONB
	, recurrence JSONB
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, FOREIGN KEY (auth_household_id, budget_account_id) REFERENCES budget_account (auth_household_id, id) ON DELETE CASCADE
);

CREATE INDEX budget_recurrence_auth_household_id_fkey
	ON budget_recurrence(auth_household_id);
CREATE INDEX budget_recurrence_updated
	ON budget_recurrence USING BRIN (updated);
CREATE INDEX budget_recurrence_template_date
	ON budget_recurrence USING BRIN ((template->>'date'));

CREATE TABLE budget_transaction (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, budget_payee_id UUID
	, id UUID PRIMARY KEY
	, date DATE NOT NULL
	, amount BIGINT NOT NULL DEFAULT 0
	, check_number INT NOT NULL DEFAULT 0
	, note TEXT
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, keep BOOL NOT NULL DEFAULT false

	, CONSTRAINT note_length CHECK (CHAR_LENGTH(note) <= 500)

	, FOREIGN KEY (budget_payee_id) REFERENCES budget_payee (id) ON DELETE SET NULL

	, UNIQUE (auth_household_id, id)
);

CREATE INDEX budget_transaction_auth_household_id_fkey
		ON budget_transaction (auth_household_id);
CREATE INDEX budget_transaction_budget_payee_id
	ON budget_transaction (budget_payee_id);
CREATE INDEX budget_transaction_date
	ON budget_transaction USING BRIN (date);

CREATE TABLE budget_transaction_account (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, budget_account_id UUID
	, budget_transaction_id UUID NOT NULL
	, id UUID PRIMARY KEY
	, amount BIGINT NOT NULL
	, status SMALLINT NOT NULL DEFAULT 0 CHECK (status < 3)

	, FOREIGN KEY (auth_household_id, budget_account_id) REFERENCES budget_account (auth_household_id, id) ON DELETE CASCADE
	, FOREIGN KEY (auth_household_id, budget_transaction_id) REFERENCES budget_transaction (auth_household_id, id) ON DELETE CASCADE
);

CREATE INDEX budget_transaction_account_auth_household_id_fkey
	ON budget_transaction_account (auth_household_id);
CREATE INDEX budget_transaction_account_budget_account_id
	ON budget_transaction_account (budget_account_id);

CREATE TABLE budget_transaction_category (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, budget_category_id UUID
	, budget_transaction_id UUID NOT NULL
	, id UUID PRIMARY KEY
	, amount BIGINT NOT NULL
	, year_month INT NOT NULL CHECK (year_month <> 0)

	, FOREIGN KEY (auth_household_id, budget_category_id) REFERENCES budget_category (auth_household_id, id) ON DELETE CASCADE
	, FOREIGN KEY (auth_household_id, budget_transaction_id) REFERENCES budget_transaction (auth_household_id, id) ON DELETE CASCADE
);

CREATE INDEX budget_transaction_category_auth_household_id_fkey
	ON budget_transaction_category (auth_household_id);
CREATE INDEX budget_transaction_category_budget_category_id
	ON budget_transaction_category (budget_category_id);

CREATE TABLE notification (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	, send_after TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
	, action TEXT NOT NULL DEFAULT ''
	, subject TEXT NOT NULL DEFAULT ''
	, recipients_fcm TEXT[]
	, recipients_smtp TEXT[]
	, body_fcm TEXT
	, body_smtp TEXT
	, attempt SMALLINT NOT NULL DEFAULT 0

	, CONSTRAINT action_length CHECK (CHAR_LENGTH(action) <= 5000)
	, CONSTRAINT subject_length CHECK (CHAR_LENGTH(subject) <= 1000)
);

CREATE INDEX notification_auth_household_id_fkey
	ON notification (auth_household_id);
CREATE INDEX notification_send_after
	ON notification USING BRIN (send_after);

CREATE TABLE plan_project (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, parent_id UUID REFERENCES plan_project (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, position TEXT NOT NULL CHECK (position <> '')
	, hidden BOOLEAN NOT NULL DEFAULT false
	, plan_task_count INT NOT NULL DEFAULT 0
	, name TEXT NOT NULL CHECK (name <> '')
	, color SMALLINT NOT NULL DEFAULT 0 CHECK (color >= 0)
	, short_id INT NOT NULL DEFAULT 0
	, shop_item_count INT NOT NULL DEFAULT 0
	, tags TEXT[]
	, budget_category_id UUID
	, icon TEXT NOT NULL DEFAULT ''

	, CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)) /* only one column can have a value */
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT position_length CHECK (CHAR_LENGTH(position) <= 100)
	, CONSTRAINT icon_length CHECK (CHAR_LENGTH(icon) <= 100)

	, FOREIGN KEY (auth_household_id, budget_category_id) REFERENCES budget_category (auth_household_id, id) ON DELETE SET NULL

	, UNIQUE (auth_account_id, short_id)
	, UNIQUE (auth_household_id, short_id)
	, UNIQUE (auth_account_id, parent_id, position)
	, UNIQUE (auth_household_id, parent_id, position)
);

CREATE INDEX plan_project_auth_household
	ON plan_project (auth_household_id);
CREATE INDEX plan_project_auth_account
	ON plan_project (auth_account_id);

CREATE TABLE plan_task (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, parent_id UUID REFERENCES plan_task (id) ON DELETE CASCADE
	, plan_project_id UUID REFERENCES plan_project (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, due_date TIMESTAMP WITH TIME ZONE
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, done BOOLEAN NOT NULL DEFAULT false
	, notified BOOLEAN NOT NULL DEFAULT false
	, recur_on_done BOOLEAN NOT NULL DEFAULT false
	, priority SMALLINT NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 4)
	, position TEXT NOT NULL CHECK (position <> '')
	, name TEXT NOT NULL CHECK (name <> '')
	, recurrence JSONB
	, tags TEXT[]
	, notify BOOL NOT NULL DEFAULT false
	, short_id INT NOT NULL DEFAULT 0
	, details TEXT NOT NULL DEFAULT ''
	, template BOOLEAN NOT NULL DEFAULT false
	, date_end DATE
	, assignees TEXT[]
	, last_done_date DATE
	, last_done_by UUID

	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 1000)
	, CONSTRAINT position_length CHECK (CHAR_LENGTH(position) <= 100)
	, CONSTRAINT plan_task_details CHECK (CHAR_LENGTH(details) <= 10000)
	, CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) = (auth_household_id IS NULL) OR (auth_account_id IS NOT NULL) != (auth_household_id IS NOT NULL)) /* only one column can have a value */

	, UNIQUE (auth_household_id, short_id)
	, UNIQUE (auth_account_id, parent_id, position)
	, UNIQUE (auth_household_id, parent_id, position)
);

CREATE INDEX plan_task_auth_household
	ON plan_task (auth_household_id);
CREATE INDEX plan_task_auth_account
	ON plan_task (auth_account_id);
CREATE INDEX plan_task_due_date
	ON plan_task USING BRIN (due_date);
CREATE INDEX plan_task_notified_notify
	ON plan_task (notified, notify);
CREATE UNIQUE INDEX plan_task_auth_account_short_id
	ON plan_task (auth_account_id, auth_household_id, short_id) WHERE (auth_household_id IS NULL);

CREATE TABLE shop_category (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, match TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL CHECK (name <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, budget_payee_id UUID
	
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT shop_category_match_length CHECK (CHAR_LENGTH(match) <= 5000)

	, FOREIGN key (auth_household_id, budget_payee_id) REFERENCES budget_payee (auth_household_id, id) ON DELETE CASCADE

	, UNIQUE (auth_household_id, id)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX shop_category_auth_household_id_fkey
	ON shop_category (auth_household_id);
CREATE INDEX shop_category_updated
	ON shop_category USING BRIN (updated);

CREATE TABLE shop_item (
	  auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, cook_recipe_id UUID
	, id UUID PRIMARY KEY
	, shop_category_id UUID
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, in_cart BOOLEAN NOT NULL DEFAULT false
	, name TEXT NOT NULL CHECK (name <> '')
	, budget_payee_id UUID
	, next_date DATE
	, recurrence JSONB
	, plan_project_id UUID REFERENCES plan_project (id) ON DELETE SET NULL
	
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT shop_item_cook_recipe_name UNIQUE (cook_recipe_id, name)

	, FOREIGN KEY (auth_household_id, cook_recipe_id) REFERENCES cook_recipe (auth_household_id, id) ON DELETE CASCADE
	, FOREIGN KEY (auth_household_id, shop_category_id) REFERENCES shop_category (auth_household_id, id) ON DELETE CASCADE
	, FOREIGN KEY (auth_household_id, budget_payee_id) REFERENCES budget_payee (auth_household_id, id) ON DELETE CASCADE
);

CREATE INDEX shop_item_auth_household_id_fkey
	ON shop_item (auth_household_id);
CREATE INDEX shop_item_updated
	ON shop_item USING BRIN (updated);


CREATE TABLE wiki_page (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, deleted TIMESTAMP WITH TIME ZONE
	, id UUID NOT NULL PRIMARY KEY
	, name TEXT NOT NULL CHECK (name <> '')
	, parent_id UUID REFERENCES wiki_page (id) ON DELETE CASCADE
	, short_id INT NOT NULL DEFAULT 0 CHECK (short_id >= 0)
	, tags TEXT[]
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, CONSTRAINT wiki_page_auth_account_household CHECK ((auth_account_id IS NOT NULL) OR (auth_household_id IS NOT NULL)) /* one column must have a value */
	, CONSTRAINT wiki_page_name_length CHECK (CHAR_LENGTH(name) <= 1000)
	, CONSTRAINT wiki_page_auth_account_parent_id_name UNIQUE (auth_account_id, parent_id, name)
	, CONSTRAINT wiki_page_auth_household_parent_id_name UNIQUE (auth_household_id, parent_id, name)
	, CONSTRAINT wiki_page_auth_account_short_id UNIQUE (auth_account_id, short_id)
);

-- Remove eventually
ALTER TABLE wiki_page
	ADD CONSTRAINT wiki_page_auth_household_short_id UNIQUE (auth_account_id, short_id);

CREATE TABLE wiki_page_version (
	  body TEXT NOT NULL DEFAULT ''
	, created_by UUID
	, id UUID PRIMARY KEY
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, wiki_page_id uuid NOT NULL REFERENCES wiki_page (id) ON DELETE CASCADE

	, CONSTRAINT wiki_content_body_length CHECK (CHAR_LENGTH(body) <= 10000)
);

CREATE INDEX plan_project_updated
	ON plan_project USING BRIN (updated);
CREATE INDEX plan_task_updated
	ON plan_task USING BRIN (updated);
CREATE INDEX wiki_page_auth_account
	ON wiki_page (auth_account_id);
CREATE INDEX wiki_page_auth_household
	ON wiki_page (auth_household_id);
CREATE INDEX wiki_page_updated
	ON wiki_page USING BRIN (updated);
CREATE INDEX wiki_page_version_updated
	ON wiki_page_version USING BRIN (updated);
CREATE INDEX wiki_page_version_wiki_page
	ON wiki_page_version (wiki_page_id);

CREATE TABLE calendar_event (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, duration INT NOT NULL
	, notify_offset INT
	, travel_time INT NOT NULL DEFAULT 0
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, timestamp_end TIMESTAMP WITH TIME ZONE NOT NULL
	, timestamp_start TIMESTAMP WITH TIME ZONE NOT NULL
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, date_end DATE
	, date_start DATE NOT NULL
	, time_start TIME NOT NULL
	, time_notification TIMESTAMP WITH TIME ZONE
	, color SMALLINT NOT NULL DEFAULT 0 CHECK (color >= 0)
	, details TEXT NOT NULL DEFAULT ''
	, location TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL CHECK (name <> '')
	, time_zone TEXT NOT NULL CHECK (time_zone <> '')
	, notified BOOLEAN NOT NULL DEFAULT false
	, skip_days DATE[]
	, recurrence JSONB
	, participants TEXT[]

	, CONSTRAINT calendar_event_auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)) /* only one column can have a value */
	, CONSTRAINT calendar_event_location_length CHECK (CHAR_LENGTH(location) <= 500)
	, CONSTRAINT calendar_event_name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT calendar_event_time_zone_length CHECK (CHAR_LENGTH(time_zone) <= 500)
	, CONSTRAINT calendar_event_duration CHECK (duration >= 0)
	, CONSTRAINT calendar_event_details CHECK (CHAR_LENGTH(details) <= 10000)
);

CREATE INDEX calendar_event_auth_account_id
	ON calendar_event (auth_account_id);
CREATE INDEX calendar_event_auth_household_id
	ON calendar_event (auth_household_id);
CREATE INDEX calendar_event_updated
	ON calendar_event USING BRIN (updated);

CREATE TABLE inventory_item (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, last_purchased DATE NOT NULL DEFAULT NOW()
	, name TEXT NOT NULL CHECK (name <> '')
	, upc TEXT NOT NULL DEFAULT ''
	, quantity INT NOT NULL DEFAULT 0 CHECK (0 <= quantity)
	, short_id INT NOT NULL DEFAULT 0
	, properties JSONB
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp

	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
	, CONSTRAINT upc_length CHECK (CHAR_LENGTH(upc) <= 20)
);

CREATE TABLE inventory_view (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, name TEXT NOT NULL CHECK (name <> '')
	, sort JSONB
	, short_id INT NOT NULL DEFAULT 0
	, columns JSONB
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp

	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
);

CREATE INDEX inventory_item_auth_household_id_fkey
	ON inventory_item (auth_household_id);
CREATE INDEX inventory_item_updated
	ON inventory_item USING BRIN (updated);
CREATE INDEX inventory_view_auth_household_id_fkey
	ON inventory_view (auth_household_id);
CREATE INDEX inventory_view_updated
	ON inventory_view USING BRIN (updated);

CREATE TABLE reward_card (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, invert BOOL NOT NULL DEFAULT false
	, short_id INT NOT NULL DEFAULT 0
	, stamp_count INT NOT NULL DEFAULT 0
	, stamp_goal INT NOT NULL DEFAULT 0
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, details TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL CHECK (name <> '')
	, reward TEXT NOT NULL DEFAULT ''
	, senders TEXT[]
	, recipients TEXT[]

	, CONSTRAINT stamp_count CHECK (stamp_count >= 0 AND stamp_count <= stamp_goal)
	, CONSTRAINT stamp_goal CHECK (stamp_goal >= 0)
	, CONSTRAINT details_length CHECK (CHAR_LENGTH(details) <= 10000)
	, CONSTRAINT reward_length CHECK (CHAR_LENGTH(reward) <= 10000)
	, CONSTRAINT name_length CHECK (char_length(name) <= 500)
);

CREATE INDEX reward_card_auth_household_fkey
	ON reward_card (auth_household_id);
CREATE INDEX reward_card_updated
	ON reward_card USING BRIN (updated);

CREATE TABLE bookmark (
	  id UUID PRIMARY KEY
	, auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, icon_link TEXT NOT NULL DEFAULT ''
	, icon_name TEXT NOT NULL DEFAULT ''
	, link TEXT NOT NULL CHECK (link <> '')
	, name TEXT NOT NULL CHECK (name <> '')
	, home BOOL NOT NULL DEFAULT false
	, short_id INT NOT NULL DEFAULT 0
	, tags text[]

	, CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)) /* only one column can have a value */
	, CONSTRAINT icon_link_length CHECK (char_length(icon_link) <= 200)
	, CONSTRAINT icon_name_length CHECK (char_length(icon_name) <= 100)
	, CONSTRAINT link_length CHECK (char_length(link) <= 200)
	, CONSTRAINT name_length CHECK (char_length(name) <= 500)
	, CONSTRAINT icon_link_name CHECK (((icon_link != '') AND (icon_name = '')) OR ((icon_link = '') AND (icon_name = '')) OR ((icon_link = '') AND (icon_name != ''))) /* only one column can have a value */
	, CONSTRAINT bookmark_auth_account_short_id UNIQUE (auth_account_id, short_id)
	, CONSTRAINT bookmark_auth_account_name UNIQUE (auth_account_id, name)
	, CONSTRAINT bookmark_auth_household_name UNIQUE (auth_household_id, name)
);

-- Remove eventually
ALTER TABLE bookmark
	ADD CONSTRAINT bookmark_auth_household_short_id UNIQUE (auth_account_id, short_id);

CREATE INDEX bookmark_updated
	ON bookmark USING BRIN (updated);

CREATE TABLE cloud_backup (
	  id UUID PRIMARY KEY
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, data BYTEA NOT NULL

	, CONSTRAINT data_length CHECK (LENGTH(data) <= 10485760)
);

CREATE INDEX cloud_backup_auth_household_id_fkey
	ON cloud_backup (auth_household_id);
