---
categories:
- guide
description: Guides for Self-Hosting Homechart
title: Self-Hosted
weight: 20
---

Self-Hosting Homechart is easy:

- Ensure your server meets the minimum requirements
- Determine if you'll use binaries or containers
- Install and setup PostgreSQL
- Install and setup Homechart
- If using [Households]({{< ref "/pricing" >}}), link your self-hosted instance to Homechart Cloud

{{% alert title="App Store and Play Store Apps" color="primary" %}}
The Homechart apps on the App Store and Play Store will work with Self-Hosted instances, but you **must** keep your Homechart instance up to date.  Homechart typically has at least monthly releases.  We try to maintain ~3 months of compatibility, so client versions +/- 3 months should work with any Homechart server.
{{% /alert %}}

## 1. Requirements

The server component of Homechart is written in Go and has very low resource requirements:

- 1 CPU
- 512MB RAM

## 2. Containers vs Binaries

Homechart can be self-hosted using containers or binaries (or a mix of both):

- Binaries use a Linux service manager like systemd.
- Containers require a runtime like [Docker](https://docs.docker.com/get-docker/), [Podman](https://podman.io/), or [Kubernetes](https://kubernetes.io/).  You should understand how these work prior to choosing this method.

## 3. Install and Setup PostgreSQL

Homechart requires full access to a [PostgreSQL 16](https://www.postgresql.org/download/) database. Older or newer versions may work, but they are not tested.  Homechart can share an existing PostgreSQL server, just create a new database for it.

### 3.1. Install PostgreSQL

#### 3.1.1. Using a Binary

Install PostgreSQL using your distribution's package manager or from source.  Instructions can be found on PostgreSQL's website.

#### 3.1.2. Using a Container

Run the [PostgreSQL container](https://hub.docker.com/_/postgres).

### 3.2. Setup PostgreSQL

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

### 4.1. Install Homechart

#### 4.1.1. Using a Binary {#binary}

Homechart binaries are available for various architectures and operating systems:

{{% release %}}

{{% alert title="Updating Homechart" color="primary" %}}
Homechart can be updated by replacing the binary with the latest version.
{{% /alert %}}

#### 4.1.2. Using a Container

Homechart containers are available on [GitHub](https://github.com/candiddev/homechart/pkgs/container/homechart).  See the platform specific [Installation Guides](#installation-guides) for usage.

#### 4.1.3. SBOM

Homechart ships with a Software Bill of Materials (SBOM) manifest generated using [CycloneDX](https://cyclonedx.org/).  The `.bom.json` manifest is available with the other [Binary Assets](#binary).

### 4.2.2 Setup Homechart

Homechart can be configured using a configuration file, environment variables, command line arguments, or using the web interface.  See the [Config Reference]({{< ref "/docs/references/config" >}}) for details.

{{% alert title="HTTPS" color="primary" %}}
Homechart should be accessed over HTTPS.  Certain functionality will only work this way.  By default, Homechart is only available using HTTP, you'll need to add a certificate to Homechart or your reverse proxy.
{{% /alert %}}

## 5. (Optional) Link Households to Homechart Cloud

Using [households]({{< ref "/pricing" >}}) in Homechart requires a subscription, even for self-hosted users. You can subscribe monthly or purchase a lifetime subscription.

You’ll need to link your self-hosted household to a household on Homechart Cloud to use your subscription. No data is transferred to Homechart Cloud, it’s just used to transfer the subscription details.

Your self-hosted instance can create an account and household on Homechart Cloud for you automatically by tapping "Create New Household with my Email Address" under the Subscription menu option.

Otherwise, follow these steps to sign up and link an account:

- Sign up for a new account on Homechart Cloud: https://web.homechart.app/signup
- On Homechart Cloud, create a household and setup a subscription (either during setup or under https://web.homechart.app/subscription)
- On your self-hosted instance, go to **Subscription** in the menu and copy the **Self-Hosted ID**
- On Homechart Cloud, paste the **Self-Hosted ID** into the appropriate field. Your household should now be linked!

## 6. Update Homechart

Homechart is meant to be easily upgradable regardless of the installation method.

### 6.1. Using a Binary

Download a new copy of homechart_latest to install or update Homechart. You can compare the SHA-512 sum of your existing executable to see if you need to update. See [Binary Install]({{< ref "/docs/guides/get-homechart/self-hosted#using-a-binary-1" >}}), it’s the same process as installing.

### 6.2. Using a Container

Pull the latest container to update Homechart, e.g.:

{{< highlight bash >}}
docker pull ghcr.io/candiddev/homechart:latest
{{< /highlight >}}

Depending on how you’re running Homechart, you may need to remove the existing Homechart container, pod, or re-run docker-compose up

## 7. Backup Homechart

Please remember to backup your data! Self-hosted Homechart is easy to backup: all persistent data is stored in PostgreSQL, Homechart doesn’t save anything locally. You can use tools like pg_dump or wal-g to perform the backup.

Additionally, you can have your self-hosted instance perform automated, encrypted backups to Homechart Cloud. Visit `/subscription` on your self-hosted instance to enable this.

## Installation Guides

### Docker

{{< highlight bash >}}
docker run -e homechart_postgresql_hostname=homechart -e homechart_postgresql_password=homechart -e homechart_postgresql_username=homechart -p 3000:3000 -d ghcr.io/candiddev/homechart:latest
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
      homechart_database_uri: postgresql://postgres:postgres@postgres/postgres
    image: ghcr.io/candiddev/homechart:latest
    ports:
      - "3000:3000"
    restart: always
  postgres:
    environment:
      POSTGRES_PASSWORD: postgres
    image: docker.io/postgres:16
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
podman run -e homechart_database_uri=postgresql://homechart:homechart@postgresql/homechart -p 3000:3000 -d ghcr.io/candiddev/homechart:latest
{{< /highlight >}}
