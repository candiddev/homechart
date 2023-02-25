# Secrets

Secrets help you protect notes, information, and other household data.

{{<hint info>}}
Our household uses Secrets for storing and sharing passwords/as a password manager.  Whenever we sign up for a new website, we generate a password and save the credentials in Homechart.

I added Secrets because Homechart needs a way to keep things completely confidential so only the person or household has access to them.  I modeled it after Bitwarden, which my household was using previously, but I wanted it to offer a more flexible method for securing values.  I also wanted to use Secrets as a way to add confidential data via Markdown, like in Notes.
{{</hint>}}

## Setup

To start using Secrets, you need to setup your [Private Key](../settings#private-key).  Secrets uses your Private Key to encrypt and decrypt values.

## Vaults

Secrets > Vaults are a way to organize and protect your Values.  Vaults can be either Personal or Household, if you choose Household you can grant access to the Vault to only certain members of your household.  Members must have setup their [Private Key](../settings#private-key) to be added to a Vault.

## Values

Secrets > Values can be any value or collection of related values that you want to keep secret.  Values live within a Vault, where they are encrypted and shared with others who have access to the Vault.  Values can have different values, including Timed-based One Time Password (TOTP) generator keys.

## Security

Secrets have their own security parameters to ensure everything is performed on the client, on top of the extensive [Homechart Security](../../security)

Secrets > Values are encrypted using **128-bit AES-GCM** via standard [Web Crypto APIs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).  The Encryption Key is encrypted using the **2048-bit RSA-OAEP Public Key** of each household member with access to the Vault. The encrypted encryption key is stored with the Vault data.  All Secrets > Values within a Secrets > Vault use the same encryption key.

## Integrations

Secret > Values can be referenced via [Markdown](../markdown) in a special way.  When you reference them, like `#secretsvalue/123`, only the people that can decrypt the value will see anything.  Additionally, you can reference a specific value by including it in the shortcode, like `#secretsvalue/123?username`.
