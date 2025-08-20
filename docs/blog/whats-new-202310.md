---
author: Candid Development
date: 2023-10-18
description: Release notes for Homechart v2023.10.
tags:
  - release
title: "What's New in Homechart: v2023.10"
type: blog
---

{{% alert title="Deprecated Feature" color="warning" %}}
We have deprecated YAML support for Homechart configurations in this release.  Please convert your configurations to use JSON/Jsonnet.
{{% /alert %}}

{{% alert title="Deprecation Warning" color="warning" %}}
We are changing our environment variable format.  The old format of uppercase snake case `HOMECHART_CLI_DEBUG` will no longer work in future versions.  Please convert your environment variables to camel case snake case (`HOMECHART_cli_debug`).  Visit [the config docs]({{< ref "/docs/references/config" >}}) for more information.
{{% /alert %}}

## Enhancements

- Calendar Events now partially dim if they are in progress.
- Homechart now uses JSON/Jsonnet for configuration.  See the [documentation]({{< ref "/docs/references/config" >}}) for more information.
- Homechart now uses camel case instead of uppercase for environment variables.  See the [documentation]({{< ref "/docs/references/config" >}}) for more information.
- Improved logging verbosity and formatting for self-hosted users.
