---
categories:
- guide
description: Setup Homechart SSO
title: Single Sign-On (SSO)
---

Homechart can integrate with third-party Identity Providers (IdP) to authenticate users.  In the future, Homechart will also act as an Identity Provider (IdP), allowing applications to use Homechart for authentication via OpenID Connect (OIDC).

## Homechart as an Identity Provider {#provider}

Applications can use Homechart as an IdP using [OpenID Connect](https://openid.net/developers/how-connect-works/).  Applications will transfer users to Homechart, where they will authorize the application to use their Homechart account, and then transfer back to the application for a seamless login process.  The application can then grab various details from Homechart about the user, like their email address, name, or household permissions.

### OIDC Clients

OIDC Applications need to be registered within Homechart to allow users to authenticate with them.  Under Settings > Households, tap the **OIDC** tab to add new clients.  Once a client is created, you can copy the OIDC **Client ID** and **Client Secret** and add it to your application's configuration.  The OIDC issuer URL will be the base URL of your Homechart instance, like `https://example.com`.

Homechart exposes the following details to OIDC applications via the OIDC identity token:

- `email` String, the user's email address
- `email_verified` Boolean, whether the user's email has been verified
- `locale` String, the user's ISO 639 code
- `name` String, the user's name
- `permissions` Map of strings to numbers, contains the household permissions for the user.  The number values indicate the level of access:
  - `0`: Edit
  - `1`: View
  - `2`: None
- `permissions_labels` Map of household label names to numbers for the user.  The number values indicate the level of access, and follow the same mapping as `permissions`.
- `updated_at` Timestamp for when the user was last updated.

Here is an example OIDC identity token:

```json
{
  "email": "jennifer@no-email.example.com",
  "email_verified": true,
  "locale": "en",
  "name": "Jennifer",
  "permissions": {
    "auth": 1,
    "bookmarks": 2,
    "budget": 2,
    "calendar": 2,
    "cook": 2,
    "health": 0,
    "inventory": 2,
    "notes": 2,
    "plan": 2,
    "reward": 2,
    "secrets": 2,
    "shop": 2
  },
  "permissions_labels": {
    "Kids - Edit": 0,
    "Kids - None": 2,
    "Kids - View": 1
  },
  "updated_at": "2025-10-22T18:58:51.643851Z"
}
```

{{% alert title="Candid Commentary" color="info" %}}
Homechart provides industry leading security for accounts with methods like FIDO, TOTP, and WebAuthn.  You already have all of your household members in Homechart, why not use it for Single Sign-On with the rest of your applications?
{{% /alert %}}

## Homechart with an Identity Provider

Homechart can authenticate users using a third-party IdP.  In this scenario, Homechart will not check passwords or security keys--it will trust the third-party IdP to authenticate the user.

### OIDC (Cloud)

Homechart current supports OIDC authentication to Apple, Google, and Microsoft.  Additional providers can potentially be added, please {{% contactus "Homechart%20OIDC%20Provider" %}}.

### OIDC (Self-Hosted)

For self-hosted users, Homechart can integrate with your existing authentication system to allow your household members to authenticate with it or even sign in automatically.

Homechart should be able to integrate with any standards-compliant OpenID Connect (OIDC) issuer.  OIDC uses OAuth to provided Homechart details about a user, which Homechart will "trust" to validate the user's authentication.

OIDC provides can be configured using {{% config oidc %}}.  The exact details of a configuration for your provider varies, but a bare minimum configuration looks something like this:

```json
{
  "oidc": {
    "google": {
      "clientID": "a-client-id",
      "clientSecret": "a-client-secret",
      "displayName": "Google",
      "oidcIssuerURL": "https://accounts.google.com"
    }
  }
}
```

**Homechart will use {{% config app_baseURL "`app_baseURL`" %}}`/oidc` as the redirect URL.**  If `app_baseURL` is set to `https://example.com`, the redirect URL would be `https://example.com/oidc`.  You'll need to use the right redirect URL when generating the client ID and client secret from your issuer.

#### Apple

{{% alert title="Candid Commentary" color="info" %}}
For whatever reason, Apple requires a yearly Apple Developer license to use OIDC.  This severely limits the ability for self-hosted folks to rely on Sign in with Apple.
{{% /alert %}}

You can add Apple as an OIDC issuer to Homechart using the same configuration as Homechart Cloud:

1. Follow [these instructions](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Enable-an-App-ID) to create an App ID.
2. Follow [these instructions](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-Services-ID) to create a Services ID.  The redirect URI will look be your Homechart instance {{% config app_baseURL "`app_baseURL`" %}}`/oidc`.
3. Follow [these instructions](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-private-key) to create a JWT key.  Convert the key using [`rot pem`](https://rotx.dev/docs/references/cli#pem).
4. Use this configuration with Homechart:
```json
{
  "oidc": {
    "apple": {
      "authURLParams": {
        "response_mode": "form_post"
      },
      "clientID": "<your Service ID>",
      "clientSecretJWTClaimsReg": {
        "aud": "https://appleid.apple.com",
        "exp": 12960000,
        "iss": "<your Team ID>",
        "sub": "<your Service ID>"
      },
      "clientSecretJWTKey": "<rot converted JWT key>",
      "displayName": "Apple",
      "oidcIssuerURL": "https://appleid.apple.com",
    }
  }
}
```

#### Google

You can add Google as an OIDC issuer to Homechart using the same configuration as Homechart Cloud:

1. Follow [these instructions](https://support.google.com/cloud/answer/6158849) to generate a Client ID and Client Secret.  The authorized redirect URL will be your Homechart instance {{% config app_baseURL "`app_baseURL`" %}}`/oidc`.
2. Use this configuration with Homechart:
```json
{
  "oidc": {
    "google": {
      "clientID": "<client ID you copied from Google>",
      "clientSecret": "<client secret you copied from Google>",
      "displayName": "Google",
      "oidcIssuerURL": "https://accounts.google.com"
    }
  }
}
```

#### Microsoft

You can add Microsoft as an OIDC issuer to Homechart using the same configuration as Homechart Cloud:

1.  Follow [these instructions](https://learn.microsoft.com/en-us/power-pages/security/authentication/openid-settings#create-an-app-registration-in-azure) to generate a Client ID and Client Secret.  The authorized redirect URL will be your Homechart instance {{% config app.baseURL baseurl-recommended %}}`/oidc`.
2. Use this configuration with Homechart:
```json
{
  "oidc": {
    "microsoft": {
      "clientID": "<client ID you copied from Microsoft>",
      "clientSecret": "<client secret you copied from Microsoft>",
      "displayName": "Microsoft",
      "oidcIssuerURL": "https://login.microsoftonline.com/consumers/v2.0"
    }
  }
}
```

### HTTP Headers

Homechart can be configured to trust HTTP headers from a trusted authentication provider.  These HTTP headers (typically `Remote-Name` or `Remote-Email`) will be passed to Homechart from the authentication provider/proxy and users will be automatically created and/or signed into Homechart.

The architecture for this depends on the proxy sitting in front of Homechart.  The example below uses Traefik and Authelia, but other setups may be supported.

Things to understand:

- The account will be created if the email address does not exist in Homechart already.  You should pre-create your household members using the email address that the SSO will pass through, otherwise they will be created under a separate household.
- If the account already exists in Homechart, Homechart will create a new session for the account associated with the email address that the SSO passes.  **Please ensure you have properly configured your SSO implementation to avoid malicious users from setting the proxy headers and gaining access to your instance.**
- At a minimum, you must have the appropriate configuration values set for {{% config app_proxyAddress %}} and {{% config app_proxyHeaderEmail %}} to enable SSO.

#### Examples

##### Traefik + Authelia + Homechart

In this example, [Traefik](https://github.com/traefik/traefik) sits in front of Homechart and proxies request to it.  [Authelia](https://github.com/authelia/authelia) is installed and configured for authentication within Traefik.  Traefik will check with Authelia to see if the traffic is allowed, and then pass the proxy headers to Homechart.  Homechart is configured to look for these proxy headers (`Remote-Name`, `Remote-Email`) and source address of Traefik.

In this contrived example, Authelia is configured with a local database of users.  On your network, you would configure Authelia to use your authentication source, such as LDAP/Active Directory.

**Traefik Dynamic Config (traefik-dynamic.yaml)**

{{< highlight yaml >}}
http:
  middlewares:
    authelia:
      forwardauth:
        address: http://localhost:9091/api/verify?rd=https://auth.example.com:8443
        authResponseHeaders:
          - Remote-Name
          - Remote-Email
        trustForwardHeader: true
  routers:
    authelia:
      service: authelia
      rule: "Host(`auth.example.com`)"
      tls: true
    homechart:
      middlewares:
        - authelia
      service: homechart
      rule: "Host(`homechart.example.com`)"
      tls: true
  services:
    authelia:
      loadBalancer:
        servers:
          - url: http://localhost:9091
    homechart:
      loadBalancer:
        servers:
          - url: http://localhost:3000
{{< /highlight >}}

**Traefik Command Line**

{{< highlight bash >}}
./traefik --entrypoints.https=true --entrypoints.https.address=:8443 --providers.file.filename=traefik-dynamic.yaml
{{< /highlight >}}

**Authelia Config (authelia.yaml)**

{{< highlight yaml >}}
server:
  host: 0.0.0.0
  port: 9091
log:
  level: debug
jwt_secret: C57E160E9CE711D214BF4CCF407DE6C64FCF19A7C20E7C6D7C2FF18826A7E1AA
default_redirection_url: https://auth.example.com:8443
authentication_backend:
  file:
    path: ./users.yaml
    password:
      algorithm: argon2id
      iterations: 1
      salt_length: 16
      parallelism: 8
      memory: 1024 # blocks this much of the RAM. Tune this.
access_control:
  default_policy: one_factor
session:
  name: authelia_session
  domain: example.com
storage:
  encryption_key: superdupersecretsecret
  local:
    path: ./db.sqlite3
notifier:
  filesystem:
    filename: ./notification.txt
{{< /highlight >}}

**Authelia User Config (users.yaml)**

{{< highlight yaml >}}
users:
  jane@example.com:
    displayname: "Jane Doe"
    password: $argon2id$v=19$m=65536,t=1,p=8$Z2JJSk9qbVlXVk9VWUtQMw$2VqsXXhvTfiHxxvmDUj8GpzPCktmMxdLR2rojFxxknc
    email: jane@example.com
    groups:
      - dev
  john@example.com:
    displayname: "John Doe"
    password: "$argon2id$v=19$m=65536,t=1,p=8$MlplVVhMbzNmcXJmaVVsaA$ydwPNQ5wW3Lu1XuPWhQW7dzlNGP3ynexmzlQmyVMaIY"
    email: john@example.com
    groups:
      - dev
{{< /highlight >}}

**Authelia Command Line**

{{< highlight bash >}}
./authelia-linux-amd64 --config authelia.yaml
{{< /highlight >}}

**Homechart Command Line**

{{< highlight bash >}}
homechart_app_proxyAddress=[::1] homechart_app_proxyHeaderEmail=Remote-Email homechart_app_proxyHeaderName=Remote-Name ./homechart_linux_amd64 -c config.json serve
{{< /highlight >}}
