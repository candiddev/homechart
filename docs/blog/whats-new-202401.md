---
author: Candid Development
date: 2024-01-28
description: Release notes for Homechart v2024.01.
tags:
  - release
title: "What's New in Homechart: v2024.01"
type: blog
---

{{% alert title="Deprecation Warning" color="warning" %}}
We are changing our environment variable format.  The old format of uppercase snake case `HOMECHART_CLI_DEBUG` will no longer work in future versions.  Please convert your environment variables to camel case snake case (`HOMECHART_cli_logLevel`).  Visit [the config docs]({{< ref "/docs/references/config" >}}) for more information.
{{% /alert %}}

## Fixes

- Fixed iCalendar export not adding TimeZone data.
- Fixed Budget > Transactions displaying empty transaction table after switching views.

## Removals

- Removed Apple OIDC authentication support.
