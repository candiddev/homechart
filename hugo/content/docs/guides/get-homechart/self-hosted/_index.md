---
categories:
- guide
description: Guides for Self-Hosting
title: Self-Hosted Homechart
weight: 20
---

Self-Hosting Homechart is easy:

- Ensure your server meets the minimum requirements
- Determine if you'll use binaries or containers
- Install and setup PostgreSQL
- Install and setup Homechart
- If using [Households]({{< ref "/pricing" >}}), link your self-hosted instance to Homechart Cloud

## 1. Requirements

The server component of Homechart is written in Go and has very low resource requirements:

- 1 CPU
- 512MB RAM

## 2. Containers vs Binaries

Homechart can be self-hosted using containers or binaries (or a mix of both):

- Binaries use a Linux service manager like systemd.
- Containers require a runtime like [Docker](https://docs.docker.com/get-docker/), [Podman](https://podman.io/), or [Kubernetes](https://kubernetes.io/).  You should understand how these work prior to choosing this method.

## 3. Install and Setup PostgreSQL

Homechart requires full access to a [PostgreSQL 14](https://www.postgresql.org/download/) database. Older or newer versions may work, but they are not tested.  Homechart can share an existing PostgreSQL server, just create a new database for it.

### Install PostgreSQL

#### Using a Binary

Install PostgreSQL using your distribution's package manager or from source.  Instructions can be found on PostgreSQL's website.

#### Using a Container

Run the [PostgreSQL container](https://hub.docker.com/_/postgres).

### Setup PostgreSQL

Create a database for Homechart on a PostgreSQL server with these commands, replacing the database name, username and password if necessary:

{{< highlight sql >}}
CREATE DATABASE homechart;
CREATE ROLE "homechart" WITH CREATEDB LOGIN PASSWORD 'homechart';
REVOKE ALL PRIVILEGES ON SCHEMA public FROM public;
GRANT ALL PRIVILEGES ON DATABASE homechart TO "homechart";
GRANT ALL PRIVILEGES ON SCHEMA public TO "homechart";
{{< /highlight >}}

## 4. Install and Setup Homechart

Homechart is distributed as a single Go binary or a container.  Both are effectively the same app, just packaged differently.

### Install Homechart

#### Using a Binary

Homechart binaries are available on [GitHub](https://github.com/candiddev/homechart/releases).

{{< tabpane text=true >}}
{{< tab header="Linux amd64" >}}
{{< highlight bash >}}
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_amd64.tar.gz -O
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_amd64.tar.gz.sha256 -O
sha256sum -c homechart_linux_amd64.tar.gz.sha256
tar -C /usr/local/bin -xzf homechart_linux_amd64.tar.gz
{{< /highlight >}}
{{< /tab >}}

{{< tab header="Linux arm" >}}
{{< highlight bash >}}
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_arm.tar.gz -O
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_arm.tar.gz.sha256 -O
sha256sum -c homechart_linux_arm.tar.gz.sha256
tar -C /usr/local/bin -xzf homechart_linux_arm.tar.gz
{{< /highlight >}}
{{< /tab >}}

{{< tab header="Linux arm64" >}}
{{< highlight bash >}}
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_arm64.tar.gz -O
curl -L https://github.com/candiddev/homechart/releases/latest/download/homechart_linux_arm64.tar.gz.sha256 -O
sha256sum -c homechart_linux_arm64.tar.gz.sha256
tar -C /usr/local/bin -xzf homechart_linux_arm64.tar.gz
{{< /tab >}}
{{< /highlight >}}
{{< /tabpane >}}

#### Using a Container

Homechart containers are available on [GitHub](https://github.com/candiddev/homechart/pkgs/container/homechart).  See the platform specific [Installation Guides](#installation-guides) for usage.

### Setup Homechart

Homechart can be configured using a configuration file, environment variables, or command line arguments.  See the [Config Reference]({{< ref "/docs/references/config" >}}) for details.

{{% alert title="HTTPS" color="warning" %}}
Homechart should be accessed over HTTPS.  Certain functionality will only work this way.  By default, Homechart is only available using HTTP, you'll need to add a certificate to Homechart or your reverse proxy.
{{% /alert %}}

## 5. (Optional) Link Households to Homechart Cloud

Using [households]({{< ref "/pricing" >}}) in Homechart requires a subscription, even for self-hosted users. You can subscribe monthly or buy a lifetime subscription/one time purchase, too.

You’ll need to link your self-hosted instance household to a household on Homechart Cloud to use your subscription. No data is transferred to Homechart Cloud, it’s just used to transfer the subscription details.

- [Sign up]({{< ref "/docs/guides/get-homechart/sign-up" >}}) for a new account on Homechart Cloud
- On Homechart Cloud, create a household and setup a subscription (either during setup or under https://web.homechart.app/subscription)
- On your self-hosted instance, go to **Subscription** in the menu and copy the **Self-Hosted ID**
- On Homechart Cloud, paste the **Self-Hosted ID** into the appropriate field. Your household should now be linked!

## Installation Guides

### Docker

{{< highlight bash >}}
docker run -e HOMECHART_POSTGRESQL_HOSTNAME=homechart -e HOMECHART_POSTGRESQL_PASSWORD=homechart -e HOMECHART_POSTGRESQL_USERNAME=homechart -p 3000:3000 -d ghcr.io/candiddev/homechart:latest
{{< /highlight >}}

### Docker Compose

1. Create this `docker-compose.yml` file:
{{< highlight yaml >}}
version: "3"
services:
  homechart:
    depends_on:
      - postgres
    environment:
      HOMECHART_POSTGRESQL_HOSTNAME: postgres
      HOMECHART_POSTGRESQL_PASSWORD: postgres
      HOMECHART_POSTGRESQL_USERNAME: postgres
    image: ghcr.io/candiddev/homechart:latest
    ports:
      - "3000:3000"
    restart: always
  postgres:
    environment:
      POSTGRES_PASSWORD: postgres
    image: docker.io/postgres:14
    restart: always
    volumes:
      - postgres:/var/lib/postgresql/data
volumes:
  postgres: {}
{{< /highlight >}}
2. Run `docker-compose up -d`

### Kubernetes (via Helm)

{{< highlight bash >}}
helm repo add homechart https://helm.homechart.app/
helm install my-homechart homechart/homechart
{{< /highlight >}}

### Podman

{{< highlight bash >}}
podman run -e HOMECHART_POSTGRESQL_HOSTNAME=homechart -e HOMECHART_POSTGRESQL_PASSWORD=homechart -e HOMECHART_POSTGRESQL_USERNAME=homechart -p 3000:3000 -d ghcr.io/candiddev/homechart:latest
{{< /highlight >}}
