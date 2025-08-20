---
categories:
- guide
description: Usage instructions for Secrets
title: Secrets
---

Secrets help you protect notes, information, and other household data.

## Setup

To start using Secrets, you need to setup your [Private Key]({{< ref "/docs/guides/settings#private-key" >}}).  Secrets uses your Private Key to encrypt and decrypt values.

## Vaults

Secrets > Vaults are a way to organize and protect your Values.  Vaults can be either Personal or Household, if you choose Household you can grant access to the Vault to only certain members of your household.  Members must have setup their [Private Key]({{< ref "/docs/guides/settings#private-key" >}}) to be added to a Vault.

## Values

Secrets > Values can be any value or collection of related values that you want to keep secret.  Values live within a Vault, where they are encrypted and shared with others who have access to the Vault.  Values can have different values, including Timed-based One Time Password (TOTP) generator keys.

## Security

Secrets have their own security parameters to ensure everything is performed on the client, on top of the extensive [Homechart Security]({{< ref "/docs/explanations/security" >}})

Secrets > Values are encrypted using **128-bit AES-GCM** via standard [Web Crypto APIs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).  The Encryption Key is encrypted using the **2048-bit RSA-OAEP Public Key** of each household member with access to the Vault. The encrypted encryption key is stored with the Vault data.  All Secrets > Values within a Secrets > Vault use the same encryption key.

## Integrations

Secret > Values can be referenced via [Markdown]({{< ref "/docs/guides/markdown" >}}) in a special way.  When you reference them, like `#secretsvalue/123`, only the people that can decrypt the value will see anything.  Additionally, you can reference a specific value by including it in the shortcode, like `#secretsvalue/123?username`.
