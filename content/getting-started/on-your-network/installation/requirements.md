---
title: Requirements
weight: 1
---

# Requirements

## 1. Server

The server component of Homechart is written in Go and has very low resource requirements:

* 1 CPU
* 512MB RAM

## 2. Database

Homechart requires a full access to a [PostgreSQL 14 database](https://www.postgresql.org/download/).  Older versions may work, but they are not tested.

You can create a database for Homechart on an existing PostgreSQL server with these commands, replacing the database name, username and password:

```
CREATE DATABASE homechart;
CREATE ROLE "homechart" WITH CREATEDB LOGIN PASSWORD 'homechart';
REVOKE ALL PRIVILEGES ON SCHEMA public FROM public;
GRANT ALL PRIVILEGES ON DATABASE homechart TO "homechart";
GRANT ALL PRIVILEGES ON SCHEMA public TO "homechart";
```
