---
author: Mike
date: 2023-03-03
summary: Release notes for Homechart v2023.03.
tags:
  - release
title: "What's New in Homechart: v2023.03"
type: blog
---

{{< homechart-release version="2023.03" >}}

**The Homechart Docker container has moved!**  Due to a recent Docker Hub pricing change, the Homechart container has moved to [GitHub](https://github.com/candiddev/homechart/pkgs/container/homechart).  The new container URL is `ghcr.io/candiddev/homechart:latest`

## Enhancements

- Budget > Recurring Transactions can now be skipped instead of added
- Cook > Recipe layout has been reworked for better usage while cooking
- Shop > Items can now use Markdown for their names, letting you create links to things online like `[Buy This](example.com/this/item)`
- Shop > Staples can now be added to Pick Up if needed before the next date
- Updated software dependencies to latest versions

## Fixes

- Fixed Budget > Charts date range picker on Firefox
- Fixed Budget > Transactions not updating recurring transactions
- Fixed Calendar imports for Google Calendar
- Fixed Reward > Cards "Always Redeemable" not working as intended
- Fixed child account switching not displaying data
- Fixed email and push notification messages having the wrong format
- Fixed incorrect translations (please keep reporting these!)
