---
author: Mike
date: 2023-12-11
description: Release notes for Homechart v2023.12.
tags:
  - release
title: "What's New in Homechart: v2023.12"
type: blog
---

{{< homechart-release version="2023.12" >}}

{{% alert title="Deprecation Warning" color="warning" %}}
We are changing our environment variable format.  The old format of uppercase snake case `HOMECHART_CLI_DEBUG` will no longer work in future versions.  Please convert your environment variables to camel case snake case (`HOMECHART_cli_logLevel`).  Visit [the config docs](../../docs/references/config) for more information.
{{% /alert %}}

## Features

- All Homechart color options can now accept arbitrary colors via a color picker.  Create your own themes, or keep the defaults for an ever-changing set of seasonal Homechart themes.
- 

## Enhancements

- Added Calendar dates for 2024
- Alerts have been moved to the bottom right
- Cook > Recipes can now have the Last Made and Times Made fields manually set

## Fixes

- Fixed Calendar > Events not having Web Push Actions for snoozing
- Fixed Calendar > Events not parsing ICS files from Google Calendar correctly
