---
weight: 2
---

# Binary Install

Homechart can be deployed as a standalone binary on Linux (amd64 and arm) from our releases website.

## 1. Review the requirements

Ensure your system meets the [Server Requirements](/getting-started/on-your-network/installation/requirements/).

## 2. Download Homechart

Visit [https://releases.homechart.app/](https://releases.homechart.app) and download the version of Homechart for your platform.  Optionally, you can verify your download by comparing the SHA-512 sum:

```
sha256sum -c homechart_latest_linux_amd64.gz.sha256
```

Once your download has completed, decompress it:

```
gzip -d sha256sum -c homechart_latest_linux_arm.gz.sha256
```

## 3. Run Homechart

The Homechart executable can be ran from any directory and stores no files locally.  You will need to provide some configuration settings via environment variables or a JSON configuration file, see [Configuration Options](/getting-started/on-your-network/installation/configuration-options/).

### ./homechart

A minimal command line for Homechart:

```
$ ./homechart -c config.json serve
```

### systemd

A base homechart.service file:
```
[Unit]
Description=Homechart - Your Handy Home Assistant
Documentation=https://docs.homechart.app
After=network.target

[Service]
Type=simple
User=homechart
Group=homechart
ExecStart=/usr/bin/homechart -c /etc/homechart.json serve
Restart=always
RestartSec=1s

[Install]
WantedBy=multi-user.target
```
