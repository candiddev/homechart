---
categories:
- guide
description: Update Homechart
title: Updates
---

Homechart is easily updated by replacing the container or executable with a newer version.

### Updating a binary

Download a new copy of homechart_latest to install or update Homechart. You can compare the SHA-512 sum of your existing executable to see if you need to update. See [Binary Install](/docs/guides/get-homechart/self-hosted#using-a-binary-1), it’s the same process as installing.

### Updating a container

Pull the latest container to update Homechart, e.g.:

{{< highlight bash >}}
docker pull ghcr.io/candiddev/homechart:latest
{{< /highlight >}}

Depending on how you’re running Homechart, you may need to remove the existing Homechart container, pod, or re-run docker-compose up
