---
author: Candid Development
date: 2025-08-10
description: Release notes for Homechart v2025.08.
tags:
  - release
title: "What's New in Homechart: v2025.08"
type: blog
---

## Deprecations

## Features

### Inventory > Item Expirations

Inventory > Items can now have expirations added to them.  Expired items will show as a number next to the Inventory menu, and within the Expired view.

## Enhancements

- Changed Calendar to automatically refresh.  See [Calendar]({{% ref "/docs/guides/calendar" %}}) for more details.
- Forms now have "Add and Duplicate" buttons to keep the form open after adding a new item.
- Health Item Logs can now be tracked per second instead of per day.
- Health correlation window can now be customized under Settings > Account.  The default is 72 hours/3 days.
- Table filters now support Comparands (<, >, <=, >=), i.e. for a column containing dates, you can have a filter of `> 2025-08-01`.
- Updated Go to 1.24.6
- Updated the UI to be more performant and snappier.

## Fixes

- Fixed Budget > Transaction form not adding custom Payees.
- Fixed Plan > Tasks not being marked completed using the form.
- Fixed SMTP notifications not working using SMTP relays like Google Workspace.

## Removals

- Removed `app_port` config, use {{% config httpServer_listenAddress %}} instead
- Removed `app_rateLimiterKey` config, use {{% config httpServer_rateLimitKey %}} instead
- Removed `app_rateLimiterRate` config, use {{% config httpServer_rateLimitPatterns %}} instead
- Removed `app_signupDisabled` config, use {{% config app_disableSignup %}} instead
- Removed `app_tlsCertificate` config, use {{% config httpServer_tlsCertificateBase64 %}} instead
- Removed `app_tlsKey` config, use {{% config httpServer_tlsKeyBase64 %}} instead
- Removed `http` config, use {{% config httpServer %}} instead
- Removed `postgresql` config, use {{% config database %}} instead
