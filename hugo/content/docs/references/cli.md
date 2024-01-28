---
categories:
- reference
description: Reference documentation for Homechart's CLI
title: CLI
---

## Arguments

Arguments must be entered before commands.

### `-c [paths]` {#c}

Path to the JSON/Jsonnet [configuration file]({{< ref "/docs/references/config" >}}).

### `-d`

Enable debug logging.

### `-n`

Disable colored log output.

### `-x [key=value]`

Set [config values]({{< ref "/docs/references/config" >}}) (can be provided multiple times)

## Commands

### `generate-vapid`

Generate a private and public key for use with Web Push.  See the [config docs]({{< ref "/docs/references/config#web-push" >}}) for more information.

### `run`

Run Homechart server.

### `seed [output path]`

Seed the database with mock data and save the output to as JSON to the output path.

### `show-config`

Print the current configuration as JSON or YAML.

### `tasks-*`

Manually run background maintenance tasks.

### `version`

Print the current version of Homechart.
