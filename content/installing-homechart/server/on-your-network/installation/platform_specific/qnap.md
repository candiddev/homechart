---
title: QNAP
---

# QNAP

Homechart works well on [QNAP devices](https://www.qnap.com/), but some users frequently encounter issues getting Homechart and PostgreSQL to talk to each other.  Here are some tips from our users on getting this working:

- Ensure you're using Docker
- Reserve an IP address for the PostgreSQL container
- Create a new Docker network for Homechart
- Set the environment variable `HOMECHART_POSTGRESQL_HOSTNAME` to the correct hostname or IP address of your PostgreSQL container
