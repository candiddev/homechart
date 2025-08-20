---
categories:
- guide
description: Usage instructions for Budget
title: Budget
---

Budget helps you manage and save your money.

## Accounts

Budget > Accounts represent the actual locations where you put your money.  These can be checking/saving accounts, investment accounts, or even assets like your house.  Budget > Accounts will contain transactions to represent how your money moves.

You can add/remove Budget > Accounts from your budget by ticking **On Budget**.  This impacts how transfers between accounts work.  Transfers between accounts that have the same budget status do not need to be [categorized](#categories), transfers between different ones must always be categorized.

As an example, if your Checking and Credit Card accounts are **On Budget**, and your House is not, a transfer from Checking Account to House must be categorized but a transfer from Checking to Credit Card does not.

## Categories

Budget > Categories are virtual "envelopes" that you allocate money towards.  Homechart comes with a few predefined categories, but we recommend you create and customize your categories for what works with your household.

A Budget > Category that has money in is money that can be "spent" for something.  Likewise, a Budget > Category that has a negative amount of money in it is money that you "owe".

Most households budget for the next month, and adjust accordingly throughout the current month.  Your goal should be to have the **Remaining** amount be 0.

[Plan > Projects]({{< ref "/docs/guides/plan#projects" >}}) and [Shop > Lists]({{< ref "/docs/guides/shop#lists" >}}) can be associated with Budget > Categories, so you can save for Vacations and Wishlists.

### Groupings

All Budget > Categories are organized under groupings.  Groupings will aggregate the money under categories for display purposes.  A special grouping, Hidden, is used to hide Budget > Categories you no longer use.

### Income

Budget > Categories that will contain income, such as money from your job or investments, should have Income ticked.  Homechart will use the Income amounts for letting you know how much money you can budget.

### Target Amounts

Budget > Categories can target a certain amount of money to simplify your budgeting.  As an example, if you have a vacation in September, you can set your Vacation budget to have a Specific Date of September, the target amount for your vacation, and Homechart will calculate how much money you need to save every month to get to that goal.

Monthly targets are used to simplify recurring expenses like cell phone or internet bills.  Monthly targets can also be limited, so once a categor hits a certain amount it will no longer be budgeted.  Yearly targets are for yearly expenses like property taxes.

## Payees

Budget > Payees represents stores, businesses, or people you exchange money with.  Payees can be used as Restaurants for [Cook]({{< ref "/docs/guides/cook" >}}) or Stores for [Shop]({{< ref "/docs/guides/shop" >}}) by ticking **Shopping Store**.

## Transactions

Budget > Transactions represent a credit or debit to an account.  Transactions typically have a Payee, either another [Budget > Account](#accounts) (for transfers) or a [Budget > Payee](#payees).  If a [Budget > Category](#categories) is required, you can add multiple to split a transaction across different categories.  You can also set the month where a transaction will count for a category--a typical use case for this is to allocate your bi-weekly paycheck across multiple months.

### Importing Transactions

You can import transactions from your financial institution by exporting them from your online banking portal as a CSV or OFX/QFX file.  In Homechart, tap **Add > Import Transactions** under an account to begin the import process.

Currently, Homechart does not support automatic import of transactions due to privacy concerns.  The current methods for importing transactions automatically, especially in the US, require a third party to access your accounts on your behalf, and these third parties do not guarantee this data will remain private.

### Recurring Transactions

You can create a recurring transaction by ticking **Recurring**.  This lets you select how/when the transaction will recur and add the transaction to the Recurring Transaction tab.  In this tab, you'll see a list of transactions and the next due date for them.  The tab will show a number next to it if there are transactions that need to be entered.  To enter a recurring transaction, tick the checkbox in the **Add** column.

### Rollup

Eventually, Homechart will start rolling up transactions into monthly summaries, typically after 1 year.  These summaries maintain the Payees/Budgets, but they will occur on the first day of the month instead of the day they really occurred.  To prevent this from happening for certain transactions, tick **Don't Rollup Transaction**.

## Integrations

Budget integrates with:

- [Calendar]({{< ref "/docs/guides/calendar" >}}): Budget > Recurring Transactions will display on your **Calendar**
- [Cook]({{< ref "/docs/guides/cook" >}}): Budget > Payees can be used as Restaurants for **Cook > Meal Plans**.
- [Plan]({{< ref "/docs/guides/plan" >}}): Budget > Categories can be associated to **Plan > Projects** so you can save for household projects
- [Shop]({{< ref "/docs/guides/shop" >}}): Budget > Categories can be associated to **Shop > Lists** so you can save for your wishlists
- [Shop]({{< ref "/docs/guides/shop" >}}): Budget > Payees can be used as Stores for **Shop > Items**.
