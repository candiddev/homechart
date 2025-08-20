---
author: Candid Development
date: 2024-11-13
description: Release notes for Homechart v2024.11.
tags:
  - release
title: "What's New in Homechart: v2024.11"
type: blog
---

## Enhancements

- Added {{% config "reload functionality" configreloadsec %}}.
- Added additional {{% config "http configurations" http %}}.
- Added {{% config "cache configuration" cache %}} to customize caching.
- Added {{% config "database configurations" database %}} to support future database providers.
- Added Calendars for 2025.
- Added the Saudi Riyal currency.
- Reordered Calendar > Event form to be easier to use.
- Updated library dependencies to latest version.

## Deprecations

- Deprecated config value `app.port`, please use {{% config http.listenAddress listenaddress %}}.
- Deprecated config value `app.rateLimiterKey`, please use {{% config http.rateLimitKey ratelimitkey %}}.
- Deprecated config value `app.rateLimiterRate`, please use {{% config http.rateLimitPatterns ratelimitpatterns %}}.
- Deprecated config value `app.tlsCertificate`, please use {{% config http.tlsCertificatePath tlscertificatepath %}}.
- Deprecated config value `app.tlsKey`, please use {{% config http.tlsKeyPath tlskeypath %}}.
- Deprecated config value `postgresql`, please use {{% config database database %}}.

## Fixes

- Fixed invalid recurrence errors when changing monthly recurrence.
