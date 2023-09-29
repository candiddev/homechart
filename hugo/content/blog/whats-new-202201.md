---
author: Mike
date: 2022-01-23
description: Release notes for Homechart v2022.01.
tags:
  - release
title: "What's New in Homechart: v2022.01"
type: blog
---

{{< homechart-release version="2022.01" >}}

## Features

### Amazon Alexa Support

You can now talk to Homechart using Amazon Alexa. Find out what your agenda is, what meals are scheduled, and more. Visit [our skill](https://alexa-skills.amazon.com/apis/custom/skills/amzn1.ask.skill.86c4726c-cb8f-45cc-bd15-39d808d6422e/launch) to get started.

### Shopping Lists

You can now create personal or household Shop Lists. These lists can be wishlists, planning, or just ideas for the future--shopping items within them do not show up in your main shopping list.

### Inventory and Plan Task Integration

Plan Tasks can now be associated to Inventory. This lets you keep track of tasks associated with certain inventory items, like car or appliance maintenance.

### iCalendar Feed

You can now view your Homechart Calendar and Plan Tasks in other calendar apps! Calendar can now expose an iCalendar feed/ICS file for other calendar programs to use.

## Enhancements

- Currency input on iOS should no longer restrict the keyboard type/prevent negative numbers.
- Homechart can now automatically signin URLs that pass a username, password, and optional permissions to it. `https://web.homechart.app/signin?username=user@example.com &password=password&cook=2` would sign in the user user@example.com with no `Cook` permissions.
- Homechart no longer vibrates after performing actions.
- Plan Tasks will now change subtask due dates the same amount when the parent due date is changed.
- Account Settings can now set colors for positive and negative text, like Budget currencies.
- Shop Items can now be personal/not visible for household members.
Household Settings can now select the Brazilian Real as a currency.
