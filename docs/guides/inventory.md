---
categories:
- guide
description: Usage instructions for Inventory
title: Inventory
---

Inventory helps you track and organize things in your household.  You can use Inventory to track big purchases, warranties, items in your pantry, storage bins, and more.

## Items

An Inventory > Item represents something in your house--a TV, a bag of flour, batteries, furniture, etc.  When you add a new Item, you can add a **Picture** of it, the **Quantity**/number you have, **Properties**, and a **UPC**.

### Import From CSV

You can import items from CSV to migrate your existing Inventory into Homechart.  Tap **Add > Import Items From CSV** to select your CSV and map the fields into [Properties](#properties).

### Quantity

A lot of the things you add into Inventory will be single items, however you can also keep track how many you have of certain things.  This is useful for tracking inventory of stuff you use in your household like cleaners, food, spices, etc.  Inventory integrates with **Shop** to let you quickly add Items to your Pick Up list when you run out.

### Properties

Items can have multiple **Properties** assigned to them.  Homechart aggregates the properties so you can easily assign them to other Items using the same values.  You'll use these **Properties** to create [Collections](#collections)

### UPC

Items can be scanned via **UPC**/Barcodes.  You can add new Items this way, or increase the **Quantity** of existing items.  UPC scanning makes taking inventory of your pantry post-grocery shopping a breeze.

## Collections

Inventory > Collections are basically views into your Inventory.  Collections let you select the **Columns**/[Properties](#properties) to display and filter the Columns/Properties for specific values.  Using Collections, you could display Items with the Property "Location" equal to "Attic".  You could also name Collections after storage totes, and add the Items within the tote to the Collection.

## QR Codes

Collections and Items can generate **QR Codes** that you can print/affix to the Collection or Item.  These QR Codes will link you directly to the Item/Collection in question.  Putting QR Codes on your storage bins will allow you to easily see what's inside of them via Homechart without having to dig through them!

## Integrations

Inventory integrates with:

- [Cook]({{< ref "/docs/guides/inventory" >}}): Inventory > Items you have a Quantity > 0 of will be displayed next to **Cook > Recipe** Ingredients
- [Plan]({{< ref "/docs/guides/plan" >}}): Inventory Items can be associated with **Plan > Tasks**, such as having a Lawn Mower Item and a Change Oil Task
- [Shop]({{< ref "/docs/guides/shop" >}}): Inventory can add Items to your **Shop > Pick Up** list
