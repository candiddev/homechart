---
categories:
- reference
description: Reference documentation for Homechart's CLI
title: CLI
---

{{% snippet cli_arguments %}}

{{% snippet cli_commands Homechart %}}

{{% cli_autocomplete %}}

{{% snippet cli_config %}}

{{% snippet cli_docs %}}

{{% snippet cli_eula Homechart %}}

### `generate-vapid`

Generate a private and public key for use with Web Push.  See {{% config webPush %}} for more information.

### `run`

Run Homechart server.

### `seed [output path]`

Seed the database with mock data and save the output to as JSON to the output path.

### `show-config`

Print the current configuration as JSON or YAML.

### `tasks-*`

Manually run background maintenance tasks.

{{% cli_version %}}
