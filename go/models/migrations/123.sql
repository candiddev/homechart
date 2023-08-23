ALTER TABLE auth_account
	ADD COLUMN subscription_referrer_code TEXT NOT NULL DEFAULT '';

ALTER TABLE shop_item
	ADD COLUMN budget_category_id UUID,
	ADD COLUMN price BIGINT NOT NULL DEFAULT 0 CHECK (price >= 0),
	ADD FOREIGN KEY (auth_household_id, budget_category_id) REFERENCES budget_category (auth_household_id, id) ON DELETE SET NULL;

ALTER TABLE shop_list
	ADD COLUMN budget_category_id UUID,
	ADD FOREIGN KEY (auth_household_id, budget_category_id) REFERENCES budget_category (auth_household_id, id) ON DELETE SET NULL;
