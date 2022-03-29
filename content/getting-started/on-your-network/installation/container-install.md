---
weight: 2
---

# Container Install

Homechart can be deployed as a container on Linux (amd64 and arm) from our images hosted on DockerHub.

## 1. Review the requirements

Ensure your system meets the [Server Requirements](/getting-started/on-your-network/installation/requirements/).

## 2. Install a container runtime

Homechart can run on any [OCI compatible runtime](https://opencontainers.org/) on Linux amd64 and arm64.  Most users use [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/).

## 3. Run Homechart

The Homechart container is configured to start Homechart server without having to specify a command or entrypoint.  You will need to provide some configuration settings via environment variables, see [Configuration Options](/getting-started/on-your-network/installation/configuration-options/).


### docker run

A minimal docker run for Homechart:

```
docker run -e HOMECHART_POSTGRESQL_HOSTNAME=homechart -e HOMECHART_POSTGRESQL_PASSWORD=homechart -e HOMECHART_POSTGRESQL_USERNAME=homechart -p 3000:3000 -d candiddev/homechart
```

### docker-compose.yml

A base docker-compose.yml file:
```
version: "3"
services:
  homechart:
    depends_on:
      - postgres
    environment:
      HOMECHART_POSTGRESQL_HOSTNAME: postgres
      HOMECHART_POSTGRESQL_PASSWORD: postgres
      HOMECHART_POSTGRESQL_USERNAME: postgres
    image: candiddev/homechart:latest
    ports:
      - "3000:3000"
    restart: always
  postgres:
    environment:
      POSTGRES_PASSWORD: postgres
    image: postgres:14
    restart: always
    volumes:
      - postgres:/var/lib/postgresql/data
volumes:
  postgres: {}
```
