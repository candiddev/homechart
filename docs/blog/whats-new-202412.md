---
author: Candid Development
date: 2024-12-13
description: Release notes for Homechart v2024.12.
tags:
  - release
title: "What's New in Homechart: v2024.12"
type: blog
---

## Features

### Custom Colors

Accounts and Households can now register custom colors for use with Calendar > Events, Plan > Tasks, and more.  Visit Settings > Account or Settings > Households to add them.

### Swipe Actions

Homechart on mobile now has swipe actions:
  - Swipe right to left to close the menu
  - Swipe left to right to close forms or open the menu
  - Swipe top to bottom to open display options
  - Swipe bottom to top to close display options

### Web Config for Self Hosted Users

Homechart can now be mostly configured from the web for self hosted users!  As an admin, you can visit Admin > Config to change configuration settings for Homechart.  This functionality {{% config app_disableWebConfig "can be disabled" %}} too, if necessary.

## Enhancements

- Budget Transactions now have stricter validation requirements for categorization.  Transfers between unbudgeted accounts must be categorized, transfers between budgeted accounts must not be.
- Homechart setup now includes config settings for admin self hosted users.
- Homechart admin access can now be {{% config app_adminTrustedCIDRs "restricted to specific networks" %}}, as well as email addresses.  By default, Homechart will restrict access to IPv4 and IPv6 private networks only.
- Homechart will now generate {{% config webpush "WebPush VAPID keys" %}} if none are configured and store them in the database.  For self-hosted users, this should enable WebPush notifications for everyone by default.
- Homechart will now make the first registered self-hosted user an admin if none are configured.

## Fixes

- Fixed Budget Transaction balance and summary roll ups to occur less frequently and include more transactions.
- Fixed cleanup jobs such as delete old tasks, purge deleted items, roll up transactions, etc. to not run if the relevant config option (like keepDeletedDays) is set to 0.

## Deprecations

- Deprecated the `signupDisabled` config option, it is now called `disableSignup`.

## Removals

- Budget Account > Budgeted flag can no longer be changed after a Budget Account is created.  You must create a new Budget Account and move the transactions manually, as they may require categorization changes.
