DROP TRIGGER IF EXISTS au_budget_month ON budget_transaction_category;

UPDATE budget_month
SET
	budget_transaction_amount_income = amount
FROM (
	SELECT
		  budget_transaction_category.auth_household_id
		, year_month
		, sum(amount) AS amount
	FROM budget_transaction_category
	LEFT JOIN budget_category ON budget_category.id = budget_transaction_category.budget_category_id
	WHERE budget_category.income
	GROUP BY
		  budget_transaction_category.auth_household_id
		, budget_transaction_category.year_month
) btc
WHERE
	budget_month.year_month = btc.year_month
	AND budget_month.auth_household_id = btc.auth_household_id;
