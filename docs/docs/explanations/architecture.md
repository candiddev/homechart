---
categories:
- explanation
description: How Homechart is architected
title: Architecture
---

This document describes the technical architecture of Homechart.

## Components

Homechart consists of three components:

<!-- no toc -->
- [Database](#database)
- [API](#api)
- [UI](#ui)

### Database

The database of Homechart is primarily for data storage. It is responsible for:

- Ensuring data consistency and referential integrity.
- Provide distributed locking for the API layer.
- Provide triggers to the API layera.

Homechart will ocassionally perform schema changes, called migrations, at startup to modify how the data is stored within the database.

Currently, the database is only provided by [PostgreSQL](https://www.postgresql.org/), but in the future SQLite may be supported.

### API

The API of Homechart is primarily a web server.  It is responsible for:

- Ensuring clients requests are authenticated and authorized.
- Rate limiting misbehaving clients.
- Providing a REST API for Homechart clients.
- Providing REST API documentation using Swagger.
- Proxying access to Homechart Cloud for Self-Hosted users.
- Run jobs like sending emails and push notifications.
- Serving the Homechart UI HTML, JavaScript, and other files.
- Store and retreive data in the database layer.
- Validate client request formats.

The API can be scaled to multiple instances for high availability or load balancing.  Multiple API servers will coordinate using the database to distribute job running and caching.

The API is written in [Go](https://go.dev/).

### UI

The UI of Homechart is a Single Page App (SPA) web application.  It is responsible for:

- Caching data locally using IndexedDB.
- Desktop and Mobile access to Homechart.
- Providing Progressive Web Application (PWA) APIs like install, sharing, and service workers.
- Push notification registration and delivery.

The UI is written in [TypeScript](https://www.typescriptlang.org/) using [Mithril](https://mithril.js.org/).

## Separation of Concerns

A common remark about Homechart is around its separation of concerns, or lack of them.  Homechart combines a lot of functionality into one application, and this can be overwhelming for folks.

Homechart was built with the idea of providing one place for all your household data.  Instead of having 5+ applications, each with their own interface/subscription/data model, you have one application that integrates all of that data together.

We understand that Homechart can't do everything though, and there are other apps that do things better.  Every component in Homechart (like Cook or Plan) can be disabled/hidden, and you can use Bookmarks to link to the alternative you want your household to use.

Homechart is designed to be flexible and provide batteries included functionality for most households, but allow more advanced households to swap the batteries if necessary.
