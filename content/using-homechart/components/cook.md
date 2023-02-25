# Cook

Cook helps you organize your recipes and create meal plans.

{{<hint info>}}
Our household uses Cook for all of our meal plans.  We have over 300 recipes, and we try to cook most of our dinners at home.  We try to get the kids to help pick out meals, but most of our meal planning involves hitting the Surprise Me button until something sounds good.  We take turns cooking meals using the Chef option to limit the amount of cooking we have to do individually.

Homechart started as a cooking app.  We were using Paprika when I decided to start building something that integrated better.
{{</hint>}}

## Meal Plans

A Cook > Meal Plan is a Cook > Recipe that happens during a Cook > Meal Time.

### Date and Time

You start by setting a **Date**, the **Meal** for the Date, and adjusting when you want to eat at.

### Chef

You can optionally choose a **Chef**--they will receive notifications on when to start preparing/cooking the meal.

### Recipe

The Cook > Recipe for a Cook > Meal Plan can be a Recipe within Homechart or just a reminder for something, like "Eating at a Restaurant".  You can send Prep and Cook reminders if you select a Recipe from within Homechart--these will notify you when you need to start preparing or cooking a meal so it's ready by the Meal Time.  You can also scale the recipe to increase the number of servings.

Not sure what to cook?  The **Surprise Me** button can help you!  You can **Filter For Tags** to choose a random recipe that has certain tags, like _dinner_.

## Meal Times

Meal Times are used with Meal Plans to organize when a Meal Plan happens.  This helps Homechart display all the recipes that will be made for a certain meal like Dinner.

Homechart comes with common meal times (Breakfast, Lunch, Dinner), but you can change them or create new ones (like Snack).

## Recipes

Recipes contain the ingredients and directions for creating meals.  Recipes can be added individually, scanned from cookbooks, or imported from CSV/websites.

### Copying Recipes

You can copy a recipe to make a new version of it under **Add > Copy Recipe**.

### Importing Recipes

#### CSV

You can mass import recipes from a CSV file under **Cook > Recipes**.  Tap **Add > Import Recipes From CSV**, select your CSV file, and map the columns in Homechart.

#### Cookbooks

Homechart can scan text from paper, like cookbooks.  You can use this to scan physical cookbooks into Homechart by creating a new Recipe, and tapping **Scan Text From Picture**

#### Website

You can import recipes from a website by tapping **Add > Import Recipe from Website**.  Fill in the website and Homechart should import it.  Not all websites work, typically if you search for a website on Google and it shows a picture of the recipe/details, it should import OK into Homechart.


### Ingredients and Directions

When adding ingredients and directions, you can use text formatting via [Markdown](../markdown) to make your recipe easier to read.  You can also reference other recipes by using `#cookrecipe` and typing the recipe name.  By adding other recipes, you can include them in your Meal Planning.

Homechart will check your [Inventory](../inventory) to see if you have any Ingredients in stock.  You'll see the Inventory icon next to the ingredient if you do.

You can add Ingredients for a Recipe to your [Shop > Pick Up](../shop#pick-up) list by tapping **Add > Ingredients to Shopping List**.

### Notes

Recipes can have **Notes** that you can use to record changes, thoughts on the recipe, and other useful notes for your future self.

### Public Recipes

You can share your recipes publicly by ticking **Public**.  You can then share the current page address with other people to have them see your recipe.

## Integrations

Cook integrates with:

- [Inventory](../inventory): Cook > Recipes will show you what Ingredients you have in your **Inventory**
- [Shop](../shop.md): Cook > Recipes ingredients can be added to your **Shop > Pick Up** list.  Homechart will consult your **Inventory** and exclude the ones you have in stock.
