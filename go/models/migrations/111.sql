INSERT INTO budget_month (
	  auth_household_id
	, budget_transaction_amount_income
	, year_month
) SELECT
		  budget_transaction_category.auth_household_id
		, sum(amount) AS budget_transaction_amount
		, year_month
	FROM budget_transaction_category
	LEFT JOIN budget_category ON budget_category.id = budget_transaction_category.budget_category_id
	WHERE budget_category.income
	GROUP BY
		  budget_transaction_category.auth_household_id
		, budget_transaction_category.year_month
ON CONFLICT (
	  auth_household_id
	, year_month
) DO UPDATE SET budget_transaction_amount_income = EXCLUDED.budget_transaction_amount_income
