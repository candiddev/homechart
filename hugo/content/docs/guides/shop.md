---
categories:
- guide
description: Usage instructions for Shop
title: Shop
---

Shop helps you organize your shopping, grocery, and wish lists.

## Lists

Shop > Lists are how you organize and plan your purchases.  Lists contain [Shop > Items](#items) that you need to buy.  You can create Personal or Household Lists, and you can associate Lists with [Budget > Categories]({{< ref "/docs/guides/budget#categories" >}}) to see how much money you have saved compared to how much money the items in the list cost.

### Pick Up

Pick Up is a special list--it's stuff that you need to buy ASAP.  You'll use the Pick Up list when you go shopping, as it has the things that your household _needs_ in it.

You can move Items from a List to Pick Up when you're ready to prioritize purchasing them.

## Stores

Shop > Stores are [Budget > Payees]({{< ref "/docs/guides/budget#payees" >}}) with the **Shopping Store** option ticked, thus helping you avoid duplicating entries.  You'll use Stores to filter your Pick Up list, so you can easily see what you need when you're at a certain Store.

## Categories

Shop > Categories make shopping easier by sorting [Shop > Items](#items) into Categories--these could be Aisles, Departments, etc.  When you go to Shop, the Pick Up list will sort the items by Category first.

Categories work by matching the name of an Item.  You can change the existing Categories, and test how they work using **Test Categories**.

Categories can also have a default **Shop > Store**, which will automatically associate Items with Stores.

## Items

Shop > Items are things you need or want to buy.  Items can have a **Price** added to them that will be used to calculate how much a List or Pick Up will cost.  Items can also be part of a Category or Store.

### Staples

Shop > Staples are recurring Items.  When you create or edit an Item, you can tick **Make Staple** and set how frequently you need to buy something.  For example, if you need to buy bread every 2 weeks, you'd set that for the recurrence.  Homechart will remember the last time you bought bread, and add bread to your Pick Up list when it's time to buy it again.


## Integrations

- [Calendar]({{< ref "/docs/guides/calendar" >}}): Shop > Pick Up can have **Cook > Meal Plan** Ingredients added using Calendar
- [Budget]({{< ref "/docs/guides/budget" >}}): Shop > Lists can be associated to **Budget > Categories** so you can save for your wishlists
- [Cook]({{< ref "/docs/guides/cook" >}}): Shop > Pick Up can include ingredients you need for your **Cook > Recipes**.  Homechart will consult your **Inventory** and exclude the ones you have in stock.
- [Inventory]({{< ref "/docs/guides/inventory" >}}): Shop > Pick Up can contain **Inventory > Items** that you need more of
- [Plan]({{< ref "/docs/guides/plan" >}}): Shop > Items can ae associated with **Plan > Projects**
