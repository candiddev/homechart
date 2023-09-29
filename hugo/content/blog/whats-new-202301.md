---
author: Mike
date: 2023-01-20
description: Release notes for Homechart v2023.01.
tags:
  - release
title: "What's New in Homechart: v2023.01"
type: blog
---

{{< homechart-release version="2023.01" >}}

## Features

### Secrets Preview

We've added Secrets to Homechart, a way to store passwords, notes, and other things you want to keep private.  Secrets encrypts your data from within the Homechart UI, ensuring only you (or your household members) have access to the values within them.  These secret values live inside Vaults, which can be personal or shared with your household members.  One neat thing we've also added with Secrets is the ability to use them within Markdown.  You can reference `#secretsvalue/aaa?Username` and have it display the value of the `Username` property to those who can decrypt it, otherwise it shows nothing.

In the future, we plan on adding the ability to import Secrets from password managers, integrate Secrets with your phone and web browsers, and give you the ability to re-encrypt everything.  We appreciate your help testing Secrets for now.

### User Interface v2

We're starting the revamp of the user interface based on feedback from users and our designer.  This will be an iterative process, and we would really appreciate your feedback on it!  With this release, we've made some changes to the readability of the app without changing the existing layout too much.  Layout changes will happen over the next couple of releases as we work towards a consistent style within the app.

## Fixes

- Fixed Budget > Categories "Budget Target Amounts" not working.
- Fixed Budget > Payees "Balance" header sorting.
- Fixed Cook > Recipes "Add Shopping Items" not adding all of the ingredients.
- Fixed Shop > Items not creating due to name conflicts.
- Fixed Shop > Items not creating due to conflicts within a Shop > List.
- Fixed SSO not working for new accounts.
- Fixed Daily Agendas not being sent correctly.
- Fixed drag and drop not working with Firefox.
- Fixed dropdown menus opening below the viewport.
