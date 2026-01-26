---
author: Candid Development
date: 2026-01-20
description: Release notes for Homechart v2026.01.
tags:
  - release
title: "What's New in Homechart: v2026.01"
type: blog
---

## Deprecations

## Features

### CalDAV Server

Homechart can now integrate with CalDAV clients as a CalDAV server.  This allows you to view and edit your Homechart events from within your favorite Calendar apps, like Apple Calendar or Mozilla Thunderbird.  See [Guides > Calendars]({{% ref "/docs/guides/calendar/#export-calendars" %}}) for more details.

### Multiple Calendars

You can now create multiple Calendars in Homechart with their own Events.  Calendars can also integrate with external calendars like Google Calendar, and have labels to provide granular access within your household.  See [Guides > Calendars]({{% ref "/docs/guides/calendar/#calendars" %}}) for more details.


## Enhancements

- **Calendar > Events** can now end recurrences using a count.
- **Budget > Recurrences** can now end recurrences using a count.
- **Plan > Tasks** can now end recurrences using a count.
- **Shop > Items** can now end recurrences using a count.
- Added a real icon picker to forms that support icons.
- Updated dependencies to latest versions.

## Fixes

- Fixed **Budget > Transactions** not displaying consistently when switching between accounts.
- Fixed **Calendar > Events** adding start notifications when updating events.
- Fixed **Plan > Task** tagging display showing new task buttons.
- Fixed **Plan > Task** copy task button copying done status.
- Fixed API not indenting JSON responses and making it horrible to read for humans.
- Fixed iOS app complaining about old/unsupported versions.
- Fixed iOS app not working with Google Sign In.
- Fixed text boxes causing weird scrolling behavior on Firefox.

## Removals

- Removed old HTTP API response format, the new HTTP API response format is now the default and no longer requires a `homechart-response` header.  See the [API docs](https://web.homechart.app/api/docs) for details.
- Removed support for these HTTP headers:
  - `x-homechart-debug`: Use `homechart-debug`
  - `x-homechart-hash`: Use `homechart-hash`
  - `x-homechart-key`: Use `Authorization: Bearer` token instead.
  - `x-homechart-token`: Use `Authorization: Bearer` token instead.
  - `x-homechart-updated`: Use `homechart-updated`
- Removed support for uppercase environment variables.
