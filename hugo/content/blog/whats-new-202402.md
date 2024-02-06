---
author: Mike
date: 2024-02-05
description: Release notes for Homechart v2024.02.
tags:
  - release
title: "What's New in Homechart: v2024.02"
type: blog
---

{{< homechart-release version="2024.02" >}}

{{% alert title="Deprecation Warning" color="warning" %}}
We are changing our environment variable format.  The old format of uppercase snake case `HOMECHART_CLI_DEBUG` will no longer work in future versions.  Please convert your environment variables to camel case snake case (`HOMECHART_cli_logLevel`).  Visit [the config docs]({{< ref "/docs/references/config" >}}) for more information.
{{% /alert %}}

## Enhancements

- Changed Keep Awake functionality to use native WakeLock APIs
- Updated all server and client libraries to latest version

## Fixes

- Fixed Cook > Recipes Add Ingredients form not showing Add column
- Fixed Inventory > Items barcode scanning on certain mobile devices with 3+ cameras

## Removals

- Removed bcrypt password hashing support (if you haven't used Homechart in a over a year, you may need to reset your password).
