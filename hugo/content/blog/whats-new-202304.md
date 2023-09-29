---
author: Mike
date: 2023-04-13
description: Release notes for Homechart v2023.04.
tags:
  - release
title: "What's New in Homechart: v2023.04"
type: blog
---

{{< homechart-release version="2023.04" >}}

**The Homechart Docker container has moved!**  Due to a recent Docker Hub pricing change, the Homechart container has moved to [GitHub](https://github.com/candiddev/homechart/pkgs/container/homechart).  The new container URL is `ghcr.io/candiddev/homechart:latest`

## Enhancements

- Added New Taiwan Dollars (NTD) currency
- Added Today shortcut to Calendar
- Added nl/Nederlands translations
- Added search to Inventory > Items using their name, UPC, or other properties
- Changed search on Secrets > Values to have improved search capabilities like Inventory > Items

## Fixes

- Fixed Budget > Categories not budgeting target amounts correctly
- Fixed Calendar > iCalendar Export showing ended events and incorrect start times
- Fixed Cook > Recipe public sharing and link generation
- Fixed Home > Recent Changes showing items that a user doesn't have access to
- Fixed currencies missing prefixes (we think this was a bug, if you preferred it the old way, please contact us!)
- Fixed a few Sign In bugs with self hosted instances

## Removals

- Removed Amazon Alexa and Google Assistant from Homechart due to Google removing our Google Assistant interface, privacy concerns, and an overall lack of usage.  ChatGPT and other Large Language Models (LLMs) are also disrupting the future/viability of these platforms, so we're waiting to see what emerges over the next couple of months.  HomechartGPT isn't out of the question, but we are hoping for more privacy centric approaches--we will not allow LLMs like ChatGPT to use your user data for training for now.  Feedback welcome, what do you think of the upcoming LLM revolution?
