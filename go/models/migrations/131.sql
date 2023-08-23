ALTER TABLE shop_item
	DROP CONSTRAINT shop_item_cook_recipe_name;

UPDATE shop_item
	SET
		  auth_account_id = shop_list.auth_account_id
		, auth_household_id = shop_list.auth_household_id
FROM shop_list
WHERe shop_list.id = shop_item.shop_list_id
