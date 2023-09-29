---
author: Mike
date: 2023-08-31
description: Release notes for Homechart v2023.08.
tags:
  - release
title: "What's New in Homechart: v2023.08"
type: blog
---

{{< homechart-release version="2023.08" >}}

## Features

### Source Available

Homechart is now source available!  You can take a look at the source code and contribute fixes on GitHub: https://github.com/candiddev/homechart.

### Budget Targeting

We've revamped how Budget Category > Target Amounts work:

- Budget > Categories now shows the Target Amount needed for the current month to remain on track with the Target Amount Date
- Budget > Categories now shows the total Target Amount for each Grouping
- Budget > Categories now shows the total Target Amount for each Month

You can use Target Amounts in a variety of ways:
- Save for a vacation
- Assign your minimum budget amounts to cover bills and expenses
- Establish a baseline for your emergency fund

## Enhancements

- The Homechart API will now fill in defaults for authAccountID or authHouseholdID if they are not specified for most object types

## Fixes

- Fixed number/currency formatting within tables to be right aligned.
- Fixed Homechart subscriptions expiring incorrectly for self-hosted instances.
- Fixed Household member names not being sorted in selectors.
- Fixed Budget > Categories Budget to Zero not having consistent behavior.
- Fixed Budget > Transactions not being able to select a Budget > Category with spaces in the name.
- Fixed Shop > Items not reflecting the right owner when changing Shop > List value.
