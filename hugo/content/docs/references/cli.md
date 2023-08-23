---
categories:
- reference
title: CLI
---

## Arguments

Arguments must be entered before commands.

### `-c [path]`

Path to a [config file](../config).

### `-d`

Enable debug logging.

### `-j`

Output JSON instead of YAML.

### `-n`

Disable colored log output.

### `-x [key=value,]`

Comma separated [config values](../config).

## Commands

### `generate-vapid`

Generate a private and public key for use with Web Push.  See the [config docs](../config/#web-push) for more information.

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
