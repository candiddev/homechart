# Updates

Homechart is easily updated by replacing the container or executable with a newer version.

## Binary Updates

Download a new copy of `homechart_latest` to install or update Homechart.  You can compare the SHA-512 sum of your existing executable to see if you need to update. See [Binary Install](../installation/binary-install.md), it's the same process as installing.

## Container Updates

Pull the latest container to update Homechart, e.g.:

```bash
$ docker pull candiddev/homechart:latest
```

Depending on how you're running Homechart, you may need to remove the existing Homechart container or re-run `docker-compose up`


