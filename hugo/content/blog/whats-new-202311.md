---
author: Mike
date: 2023-11-03
description: Release notes for Homechart v2023.11.
tags:
  - release
title: "What's New in Homechart: v2023.11"
type: blog
---

{{< homechart-release version="2023.11" >}}

{{% alert title="Deprecated Feature" color="warning" %}}
We have deprecated YAML support for Homechart configurations in this release.  Please convert your configurations to use JSON/Jsonnet.
{{% /alert %}}

{{% alert title="Deprecation Warning" color="warning" %}}
We are changing our environment variable format.  The old format of uppercase snake case `HOMECHART_CLI_DEBUG` will no longer work in future versions.  Please convert your environment variables to camel case snake case (`HOMECHART_cli_debug`).  Visit [the config docs]({{< ref "/docs/references/config" >}}) for more information.
{{% /alert %}}

## Fixes

- Fixed WebCrypto errors when signing in or signing up for Homechart on self-hosted instances using HTTP.  **It is highly recommended to switch your self-hosted instances to access Homechart using HTTPS**
- Fixed Budget > Transaction account and category names disappearing when multiple are added in a transaction
- Fixed Cook > Recipes importing certain websites and missing directions.
- Fixed Settings > Households not being able to select AUD currency
