---
categories:
- guide
description: Setup Homechart backups
title: Backups
---

Please remember to backup your data! Self-hosted Homechart is easy to backup: all persistent data is stored in PostgreSQL, Homechart doesn’t save anything locally. You can use tools like pg_dump or wal-g to perform the backup.

Additionally, you can have your self-hosted instance perform automated, encrypted backups to Homechart Cloud. Visit `/subscription` on your self-hosted instance to enable this.
