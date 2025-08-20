---
author: Candid Development
date: 2024-09-03
description: Release notes for Homechart v2024.09.
tags:
  - release
title: "What's New in Homechart: v2024.09"
type: blog
---

## Features

### OIDC Client

Homechart now supports using most standards-compliant OpenID Connect (OIDC) issuers for single-sign on (SSO).  Self-hosted users should visit [Setup Homecahrt SSO]({{% ref "/docs/guides/sso" %}}) for more information.

## Enhancements

- Added Refresh Subscription button to Subscriptions for self-hosted users.
- Added `Authorization: Bearer` support for API request authorization (see API docs for more details).

## Removals

- `x-homechart-id` and `x-homechart-key` API request authorization has been deprecated.  Please rewrite your custom Homechart API calls to use `Authorization: Bearer <old x-homechart-key value>` instead.
