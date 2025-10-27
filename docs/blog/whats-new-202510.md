---
author: Candid Development
date: 2025-10-01
description: Release notes for Homechart v2025.10.
tags:
  - release
title: "What's New in Homechart: v2025.10"
type: blog
---

## Deprecations

## Features

### Create Notifications

Household members will now receive push notifications when various objects are created.  These can be disabled under Settings > Notifications.

### OIDC Provider

Homechart can now act as an OpenID Connect (OIDC) provider.  You can configure various applications to use Homechart accounts for authentication, similar to Google or Microsoft IDs, using OIDC.  See [SSO]({{% ref "/docs/guides/sso" %}}) for more details.

### URL State Tracking

Homechart now stores most page settings (like table columns and filters) in the URL.  This makes it easy to bookmark and share customized views and filters.

### WebAuthn

Users can now sign in to Homechart using WebAuthn, Passkeys, and FIDO2 keys.  Users can also disable password and email authentication for extra security.

## Enhancements

- Changed Budget > Transactions can now jump to specific pages.
- Changed the self-hosted toggle to be more obvious during Sign In and Sign Up
- Updated Go and web dependencies to latest versions

## Fixes

- Fixed Calendar Add and Duplicate not working for multiple day events.

## Removals
