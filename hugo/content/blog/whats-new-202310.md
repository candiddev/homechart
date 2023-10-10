---
author: Mike
date: 2023-09-10
description: Release notes for Homechart v2023.10.
tags:
  - release
title: "What's New in Homechart: v2023.10"
type: blog
---

{{< homechart-release version="2023.10" >}}

{{% alert title="Note" color="warning" %}}
We have deprecated YAML support for Homechart configurations in the this release.  Please convert your configurations to use JSON/Jsonnet.
{{% /alert %}}

## Enhancements

- Homechart now uses JSON/Jsonnet for configuration.  See the documentation for more information.
- Improved logging verbosity and formatting for self-hosted users.
