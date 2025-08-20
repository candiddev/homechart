---
author: Candid Development
date: 2025-04-01
description: Release notes for Homechart v2025.04.
tags:
  - release
title: "What's New in Homechart: v2025.04"
type: blog
---

## Deprecations

- Child accounts have been replaced with Account Delegations.

## Features

### Delegations

We've streamlined Child accounts and delegated access into Account Delegations.  Accounts can now be shared within a household, allowing other accounts to sign in as them via Switch Account or access their Health data.  Originally, this feature was used for child accounts, but it can now be used to share access for anyone within the household.

## Enhancements

- Added Calendar > iCalendar refresh--iCalendars with URLs will now be refreshed every hour
- Added Calendar > iCalendar colors
- Added support for SMTP LOGIN / Microsoft Office 365 SMTP relays
- Changed Homechart to stop asking to change the default language
- Updated Go to 1.24.3
- Updated Go dependencies to latest versions
- Updated web dependencies to latest versions

## Fixes

- Fixed Budget > Transactions displaying incorrect number of transactions in title
