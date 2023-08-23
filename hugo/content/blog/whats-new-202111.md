---
author: Mike
date: 2021-11-22
summary: Release notes for Homechart v2021.11.
tags:
  - release
title: "What's New in Homechart: v2021.11"
type: blog
---

{{< homechart-release version="2021.11" >}}

## Features

### Bookmark Launch

Homechart can now store bookmarks that link to websites, cloud services, files, etc.  These Bookmarks can be tagged, personal or household, and used everywhere in Homechart that supports markdown.  You can use Bookmarks to organize receipts and add them to Budget Transactions, or warranty information and add it to Inventory Items.  In the future, Homechart will support connecting to various services (like Google Drive) and automatically import files as bookmarks.

### Text Formatting Toolbar

Homechart now has a text formatting toolbar!  Along with traditional options like bold and italic, it also has an easy way to create shortcut links to everything in Homechart.

### Vault Support for Configuration Items

Homechart can now use HashiCorp Vault to pull in configuration data from kv2 secrets.  See the DockerHub page for more details.

### New Homechart Cloud Subscription Options

Homechart Cloud has three new subscription options: monthly, yearly, and lifetime.

## Enhancements

- Added linux/arm/v7 builds (should support 32 bit Raspberry Pi 4s now)
- Added more currency options (South African Rand, Swiss Franc)
- Added more date formatting options
- Added version information to the App menu
