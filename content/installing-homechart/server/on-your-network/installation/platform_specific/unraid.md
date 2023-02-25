---
title: unRAID
---

# unRAID

Homechart works well on [unRAID Servers](https://unraid.net/), but some users frequently encounter issues getting Homechart and PostgreSQL to talk to each other.  Here are some tips from our users on getting this working:

- Ensure you're using Docker
- Set the environment variable `HOMECHART_POSTGRESQL_HOSTNAME` to the correct hostname or IP address of your PostgreSQL container (make sure to reserve the IP)
