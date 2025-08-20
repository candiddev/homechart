---
author: 
date: 2025-05-01
description: Release notes for Homechart v2025.05.
tags:
  - release
title: "What's New in Homechart: v2025.05"
type: blog
---

## Deprecations

- Homechart's current API response format is being deprecated.  See https://web.homechart.app/api/docs for more details on the new format--it's meant to streamline responses and provide more detailed error messages.  To receive requests with the new format, add the HTTP header `Homechart-Response: new`.
- These Homechart API HTTP Headers are being deprecated:
  - `X-Homechart-Debug` (use `Homechart-Debug`)
  - `X-Homechart-Hash` (use `Homechart-Hash`)
  - `X-Homechart-Key` (use `Authorization: Bearer`)
  - `X-Homechart-SelfHostedIDs` (use `Homechart-SelfHostedIDs`)
  - `X-Homechart-Token` (use `Authorization: Bearer`)
  - `X-Homechart-Updated` (use `Homechart-Updated` )
- `app_sessionExpirationDefaultSeconds` is now `app_sessionExpirationDefault` and accepts a duration such as `1h`.
- `app_sessionExpirationRememberSeconds` is now `app_sessionExpirationRemember` and accepts a duration such as `90d`.
- `app_sseTimeoutMinutes` is now `app_sseTimeout` and accepts a duration such as `10m`.

## Features

### Bookmark Label Permissions

Household members can now grant View/Edit/None access to Bookmarks via Labels.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Budget Label Permissions

Household members can now grant View/Edit/None access to Budgets > Accounts, Categories, and Payees via Labels.  This can be used to allow your children access to their Savings or Checking account and associated Categories only. See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Cook > Recipe Label Permissions

Household members can now grant View/Edit/None access to Cook > Recipes via Labels.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Inventory Label Permissions

Household members can now grant View/Edit/None access to Inventory > Collections and Items via Labels.  This can be used to grant granular access to specific parts of your Inventory.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Notes Label Permissions

Household members can now grant View/Edit/None access to Notes > Pages via Labels.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Plan > Projects Label Permissions

Household members can now grant View/Edit/None access to Plan > Projects via Labels.  Members can add, remove, and edit Plan > Tasks for Projects they have access to.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

### Shop > List Label Permissions

Household members can now grant View/Edit/None access to Shop > Lists via Labels.  Members can add, remove, and edit Shop > Items for Lists they have access to.  See [Permissions]({{% ref "/docs/guides/permissions.md" %}}) for more information.

## Enhancements

- Household members that are participants of a Calendar > Event will now see the event without needing Calendar view or edit permissions.
- Household members that are recipients of a Reward > Card will now see the card without needing Reward view or edit permissions.
- Household members that are are added to Secrets > Vaults will now see the Vault and Secrets > Values without needing Secrets view or edit permissions.
- Increased Self-Hosted key expirations to 14 days.
- Updated swagger documentation to be more useful for API users/developers.

## Fixes

- Fixed Calendar > iCalendar not updating Calendar > Events color.

## Removals

- Removed newsletter functionality from Homechart, newsletters are now hosted on [Google Groups](https://homechart.app/docs/references/mailing-lists/).
