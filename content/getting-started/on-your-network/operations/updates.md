# Updates

Homechart is easily updated by replacing the container or executable with a newer version.

## Binary Updates

To update your Homechart binary, download a new copy of `homechart_latest`.  You can compare the SHA-512 sum of your existing executable to see if you need to update.

## Container Updates

To update your Homechart container, pull the latest container, e.g.:

`docker pull candiddev/homechart:latest`

Depending on how you're running Homechart, you may need to remove the existing Homechart container or re-run `docker-compose up`


