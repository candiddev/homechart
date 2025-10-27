---
categories:
- guide
description: Usage instructions for Settings
title: Settings
---

Settings are where you manage all of the various controls for Homechart.

## Account

Settings > Account has controls for adjusting your **Preferences**, **Components**, and **Security**.

### Preferences {#account-preferences}

You can adjust your account **Name**, **Language, Date, and Time**, and **Color and Theme** under **Preferences**.  Your account **Name** will be visible to all members of your Household.

### Hide Components {#account-hide}

Using the controls on this page, you can hide various components within Homechart.  You may not be able to un-hide items that are hidden at the [household level](#household-hide).

### Security

You can setup your **Private Key**, change your **Password**, and setup **Two-Factor Authentication** under **Security**.

#### Private Key

You need to generate a **Private Key** to use Secrets and other encryption components in Homechart.  You can generate multiple **Private Key Passphrases** to store within a safe or somewhere safe.

Homechart uses **2048-bit RSA-OAEP** to generate a Public/Private key-pair.  The **Private Key** is encrypted using **100,000 iterations of PBKDF2** using the **Private Key Passphrases** as the keys.  All encryption is performed using standard [Web Crypto APIs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

#### Delegations

Accounts can delegate access by adding **Account Delegations**.  The **Target Account** will be able to sign in as the **Source Account** via **Switch Account**.  Additional access can also be shared, such as **Health** to view/add Health data.  The delegation can also be configured to only allow the **Target Account** to change or remove the delegation--perfect for child accounts.

## Notifications

Settings > Notifications has controls for enabling/disabling different types of Notifications from Homechart.

## Sessions

Settings > Sessions lets you delete Sessions, **Clear All Sessions**, and add new sessions/generate API keys for programmatic usage of Homechart.

### Permissions {#session-permissions}

Homechart permissions can be set per-session, allowing you to have very granular access on each device you sign into.  You can use session permissions to control access on shared devices, such as tablets or other kiosks, to ensure they can only view certain things in Homechart.

## Households

Settings > Households is where you Add, Delete, and Leave households within Homechart.  You can be part of many Households, like one for your immediate family and one for your extended family.  To use Household features within Homechart, you must be part of at least one Household.

One Household will always be your **Primary Household**.  This is the default Household you'll use when you create new Household items.  You can change this by tapping the checkbox in the **Primary** column.

### Household Settings

Tapping a Household under Settings > Households shows you controls for adjusting **Preferences**, **Members**, and **Components**.

#### Preferences {#household-preferences}

You can adjust your household **Name**, **Colors**, and **Currency** under **Preferences**.

### Members

You can add, remove, and change the permissions of household members under **Members**.

### OIDC

You can add, remove, and change OIDC clients for your household.  See [Homechart as an Identity Provider]({{% ref "/docs/guides/sso#provider" %}}) for more details.
