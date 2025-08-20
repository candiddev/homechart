---
author: Candid Development
date: 2025-01-08
description: Release notes for Homechart v2025.01.
tags:
  - release
title: "What's New in Homechart: v2025.01"
type: blog
---

## Features

### Cook > Restaurants

Homechart can now help you organize restaurants.  You can add details for each restaurant like phone numbers and menu links, as well as the meals your household likes/dislikes.  You can then search for which restaurant has the best chicken nuggets for the kids (or your partner), because that's all they're going to eat anyways.

Restaurants can also be part of your [Cook > Meal Plans]({{< ref "/docs/guides/cook#meal-plans" >}}) as well, and you can receive reminders to avoid being late for your reservations.

### Mailing Lists

We are moving all of our discussions from GitHub and Reddit to email-based mailing lists.  See [Mailing Lists]({{< ref "/docs/references/mailing-lists" >}}) for more information.

## Enhancements

- Added a `docs` command to quickly view the Homechart documentation website.
- Budget > Categories can now have monthly target amount limits.  Once a Budget > Category reaches this amount, no more money will be added to it when using Budget Target Amounts.
- Command line arguments now support partial command matching.  Homechart will attempt to match a partial CLI command (like `cfg`) to the longest matching command or macro (in this instance, `config`).
- Cook > Meal Plans with custom restaurants or recipes can now have Cook, Leave By, and Prep reminder notifications.
- Drag has been completely revamped to be more responsive and no longer require tapping an icon.  Dragging Plan > Tasks and Shop > Items now use click and hold (or tap and hold on mobile) to drag items.
- Plan > Tasks can now be swiped right on mobile to complete them.
- Shop > Items can now be swiped right on mobile to add/remove them from the cart.

## Fixes

- Fixed Calendar hanging after scrolling between dates
- Fixed Calendar picker not displaying events correctly on mobile
- Fixed Budget > Categories "Budget Target Amounts" calculations
- Fixed Plan > Task recurrences not ending in Calendar view
- Fixed new Secrets > Values not having visible Values populated
- Fixed swiping actions registering for diagnoal swipes.
