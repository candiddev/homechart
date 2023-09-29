---
author: Mike
date: 2023-05-08
description: Release notes for Homechart v2023.05.
tags:
  - release
title: "What's New in Homechart: v2023.05"
type: blog
---

{{< homechart-release version="2023.05" >}}

## Features

### Web Push Notification Revamp

We've greatly improved our web push notifications so you can do more with them.  Most notifications can now be snoozed, and you can now mark Plan > Tasks as completed right from the push notification.  Additionally, self-hosted users will now self-host their push notifications, they no longer need to proxy through Homechart Cloud!  See [the docs](https://docs.homechart.app/installing-homechart/server/on-your-network/installation/configuration-options/#webpush) for more information.

## Enhancements

- Daily Agenda Summaries can now be sent by email.  You can turn these off under Settings > Notifications.
- Inventory > Collections now shows the number of items contained within them in the menu.  This has not been optimized yet, and it may lead to performance issues with large collections/large number of items.  Please let us know if you experience this and we'll prioritize fixing it.  We tested with ~100 items, ~50 collections, and an Android phone--we did not notice any issues.

## Fixes

- Fixed date inputs not showing picker or responding to keyboard inputs correctly.
- Fixed breadcrumb occasionally hiding action buttons.
- Fixed Budget > Categories selecting the wrong date for a target month.
- Fixed Calendar > Events hanging due to a Recurrence calculation loop.
- Fixed Calendar > Events showing the wrong date for events when exported using iCalendar.
- Fixed Cook > Meal Plan not setting the right time for Meal Times.
- Fixed Health > Items and Health > Logs not creating entries for children.
- Fixed Inventory > Item setting the quantity to 0.

## Removals

- Removed push notification proxy via Cloud Notifications for self-hosted instances.  Please use Web Push notifications directly from your instance--we don't want your private data!  See [the docs](https://docs.homechart.app/installing-homechart/server/on-your-network/installation/configuration-options/#webpush) for more information.
