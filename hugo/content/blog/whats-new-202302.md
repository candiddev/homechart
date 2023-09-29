---
author: Mike
date: 2023-02-07
description: Release notes for Homechart v2023.02.
tags:
  - release
title: "What's New in Homechart: v2023.02"
type: blog
---

{{< homechart-release version="2023.02" >}}

## Features

### Help Revamp

We moved our Help documentation to the docs website, https://docs.homechart.app.  We also changed the in-app Help button to use the docs website for displaying help pages.  Help should be more useful now, and you can edit it if you want to help out!

### Multilingual Support

We added support for different languages within Homechart.  You can now switch between Arabic, Chinese, English, French, German, Hindi, and Spanish.  We tried to cover everything with these translations, but we may have messed stuff--please let us know!  Additionally, these translations have been provided by a cloud service and may not be accurate.  If you notice the translations are wrong, please contact us or edit the file directly on GitHub!

## Enhancements

- Budget > Transactions now have a combined input field for Transfers and Budget > Payees.
- Cook > Recipes should now import recipes from more websites
- Plan > Tasks now displays the parent Plan > Project in the tabs, allowing you to traverse your nested projects easier.

## Fixes

- Fixed Budget > Categories coloring category names if they contain numbers.
- Fixed Budget > Transactions not updating automatically when new transactions are added.
- Fixed Calendar events like Meal Plans being difficult to edit
- Fixed Cook > Recipes add menu opening below the visible table space.
- Fixed Notes > Page Table of Contents not wrapping long headers appropriately.
- Fixed Notes > Page Table of Contents interpreting code comments as headings.
- Fixed Secrets > Vaults tabs not filtering between personal/household correctly.
- Fixed Shop > List deletion not redirecting to Shop > Lists.
- Fixed Shop > List movement between personal/households not updating Shop > Items too
- Fixed Subscriptions not being viewable on some Android devices.
- Fixed daily agenda reporting incorrect count of tasks.
- Fixed forms not checking if a self-hosted household is linked to a Homechart Cloud household.
- Fixed help search not working correctly.
- Fixed markdown stripping spaces/indents for code blocks.
