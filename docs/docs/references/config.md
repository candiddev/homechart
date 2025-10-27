---
categories:
- reference
description: Reference documentation for Homechart's configuration
title: Config
---

{{% snippet config_format Homechart homechart %}}

## Configuration Values

{{% snippet config_key "app_adminEmailAddresses" "(recommended)" %}}

List of strings, email addresses which will have admin access to Homechart for their account.  If combined with `adminTrustedCIDRs`, 

**Default:** `[]`

{{% snippet config_key "app_adminTrustedCIDRs" "(recommended)" %}}

List of IPv4 and IPv6 networks.  If `adminEmailAddresses` is not specified, any account from these networks will be granted admin access to Homechart.  If `adminEmailAddresses` is specified, it will limit the admin access granted for `adminEmailAddresses` to traffic originating from the networks specified.

Should be combined with `xForwardedTrustedCIDRs` to ensure the appropriate remote IP is being checked, otherwise this may grant admin access to anyone on the internet.

**Default:**
```json
[
  "10.0.0.0/8",
  "127.0.0.1/32",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "::1/128",
  "fd00::/8",
]
```

{{% snippet config_key "app_baseURL" "(recommended)" %}}

String, base URL for Homechart, mostly used by notifications.  Should match the URL users will access Homechart from.

**Default:** `"https://example.com"`

{{% snippet config_key "app_cacheTTLMinutes" %}}

Number, number of minutes to keep entries in cache.

**Default:** `15`

{{% snippet config_key "app_disableSignup" "(recommended)" %}}

Boolean, disables new account signups.  Accounts can still be created/invited under the Admin > Accounts.  Self-hosted instances should enable this after they have setup their initial account.

**Default:** `false`

{{% snippet config_key "app_disableTasks" %}}

Boolean, disable any background tasks (sending notifications, cleaning up old data) from running on this instance.

**Default:** `false`

{{% snippet config_key "app_disableWebConfig" %}}

Boolean, disables configuration via Web/HTTP.

**Default:** `false`

{{% snippet config_key "app_keepCalendarEventDays" %}}

Number, number of days to retain Calendar Events after their end date.  Setting this to 0 disables Calendar Event cleanup.

**Default:** `180`

{{% snippet config_key "app_keepCookMealPlanDays" %}}

Number, number of days to retain Cook Meal Plans after their scheduled date.  Setting this to 0 disables Cook Meal Plan cleanup.

**Default:** `180`

{{% snippet config_key "app_keepDeletedDays" %}}

Number, number of days to keep deleted data (Notes, Cook Recipes, Secret Values).  Setting this to 0 disables deleted data cleanup.

**Default:** `30`

{{% snippet config_key "app_keepHealthLogDays" %}}

Number, number of days to retain Health Logs.  Setting this to 0 disables Health Log cleanup.

**Default:** `180`

{{% snippet config_key "app_keepNotesPageVersions" %}}

Number, number of Notes Page Versions to keep.

**Default:** `10`

{{% snippet config_key "app_keepPlanTasksDays" %}}

Number, number of days to keep completed tasks.

**Default:** `90`

{{% snippet config_key "app_motd" %}}

String, informational message to display on the UI for all users.

**Default:** `""`

{{% snippet config_key "app_privateKeys" %}}

List of private keys to use for signing and other cryptographic operations.  Users shouldn't set this value--Homechart will generate keys at startup and store them in a database.  Users can rotate these keys by removing them from Admin > Config--Homechart will generate new keys after restarting.

**Default:** `[]`

{{% snippet config_key "app_port" %}}

Number, listening port for Homechart.  Setup port forwarding to this port to expose Homechart externally.

**Default:** `3000`

{{% snippet config_key "app_proxyAddress" %}}

String, Upstream IPv4 or IPv6 address of a trusted proxy.  See the [Single Sign-On (SSO) guide]({{< ref "/docs/guides/sso" >}}) for usage details.

**Default:** `""`

{{% snippet config_key "app_proxyHeaderEmail" %}}

String, proxy header that should be associated with an account email address.  See [Single Sign-On (SSO) guide]({{< ref "/docs/guides/sso" >}}) for usage details.

**Default:** `""`

{{% snippet config_key "app_proxyHeaderName" %}}

String, proxy header that should be associated with an account name.  See [Single Sign-On (SSO) guide]({{< ref "/docs/guides/sso" >}}) for usage details.

**Default:** `""`


{{% snippet config_key "app_rollupBudgetMonthCategoriesMonths" %}}

Number, number of months before a Budget Category month detail is rolled up into the next Budget Category month.  Setting to 0 disables category roll ups.  Not rolling up categories may impact performance.

**Default:** `96`

{{% snippet config_key "app_rollupBudgetTransactionsBalanceMonths" %}}

Number, number of months before a Budget Transaction is rolled up into a starting balance.  Setting to 0 disables balance roll ups.  Not rolling up transactions may impact performance.

**Default:** `96`

{{% snippet config_key "app_rollupBudgetTransactionsSummaryMonths" %}}

Number, number of months before a Budget Transaction is rolled up into monthly summaries.  Setting to 0 disables summary roll ups.  Not rolling up transactions may impact performance.

**Default:** `48`

{{% snippet config_key "app_sessionExpirationDefault" %}}

String, duration until non-Remember Me sessions expire. {{% config_duration %}}

**Default:** `"1h"`

{{% snippet config_key "app_sessionExpirationRemember" %}}

String, duration until Remember Me sessions expire. {{% config_duration %}}

**Default:** `"90d"`

{{% snippet config_key "app_sseTimeout" %}}

String, duration until SSE requests will be removed due to inactivity.

**Default:** `"10m"`

{{% snippet config_key "app_tlsCertificate" "(recommended)" %}}

String, path to a SSL/TLS certificate file.  Should work for the domain in your [baseURL](#app_baseURL).  If set, along with [tlsKey](#app_tlsKey), Homechart will listen for HTTPS connections only.  HTTPS is necessary for certain Homechart functionality, you should enable HTTPS within Homechart or your reverse proxy.

**Default:** `""`

{{% snippet config_key "app_tlsKey" "(recommended)" %}}

String, path to a SSL/TLS private key file.  Should work for the domain in your [baseURL](#app_baseURL).  If set, along with [tlsCertificate](#app_tlsCertificate), Homechart will listen for HTTPS connections only.  HTTPS is necessary for certain Homechart functionality, you should enable HTTPS within Homechart or your reverse proxy.

**Default:** `""`

{{% snippet config_cli homechart %}}

{{% snippet config_cache %}}

{{% snippet config_database %}}

{{% snippet config_httpClient Homechart %}}

{{% snippet config_httpServer ":3000" homechart %}}

{{% snippet config_jsonnet true %}}

{{% snippet config_key "oidc" %}}

OIDC is a map of OIDC issuer names to OIDC configurations.  See [Setup Homechart SSO]({{< ref "/docs/guides/sso" >}}) for more information.

**Default:** `{}`

### `oidc_[issuer_name]_authURL` {#oidc_authURL}

String, the endpoint for OAuth.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_caCertificateBase64` {#oidc_caCertificateBase64}

String, the CA certificate used to communicate with the issuer.  Useful with private OIDC servers without public certificates.

**Default:** `""`

### `oidc_[issuer_name]_clientID` {#oidc_clientID}

String, the ID shared with clients for OAuth requests.  Required.

**Default:** `""`

### `oidc_[issuer_name]_clientSecret` {#oidc_clientSecret}

String, the secret shard with clients for OAuth requests.  Required.

**Default:** `""`

### `oidc_[issuer_name]_codeChallengeMethodsSupported` {#oidc_codeChallengeMethodsSupported}

List of strings, the supported algorithms for OIDC code challenges.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_displayName` {#oidc_displayName}

String, the name that will be displayed in the UI for the OIDC issuer.

**Default:** `""`

### `oidc_[issuer_name]_icon` {#oidc_icon}

String, a URL for an icon to display for the OIDC issuer.  If this issuer has a name of `google` or `microsoft`, an icon will be provided by Homechart.

**Default:** `""`

### `oidc_[issuer_name]_jwksKeys` {#oidc_jwksKeys}

List of strings, a list of public keys for an OIDC issuer.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_jwksURI` {#oidc_jwksURI}

String, a URL for retrieving JWKS keys for an OIDC issuer.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_issuerURL` {#oidc_issuerURL}

String, the issuer URL to be compared with the `issuer` of the token.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_oidcIssuerURL` {#oidc_oidcIssuerURL}

String, URL to retrieve issuer configurations.  Should be the base path without `/.well-known/openid-configuration`, i.e. `https://accounts.google.com`.

**Default:** `""`

### `oidc_[issuer_name]_scopes` {#oidc_scopes}

List of strings, a list of scopes to request.  If empty, will be set to "openid" and "email".  Homechart requires `sub` and `email` claims in an ID token to successfully authenticate a user using OIDC.

**Default:** `""`

### `oidc_[issuer_name]_tokenURL` {#oidc_tokenURL}

String, the URL to retrieve tokens.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

### `oidc_[issuer_name]_userInfoEndpoint` {#oidc_userInfoEndpoint}

String, the URL to retrieve user info.  Can be discovered from [`oidcIssuerURL`](#oidc_oidcIssuerURL).

**Default:** `""`

{{% snippet config_key "smtp" %}}

Homechart can use a SMTP server to send notifications to your household members.

{{% snippet config_key "smtp_fromAddress" %}}

String, email address to send from.  Required to make SMTP work.

**Default:** `""`

{{% snippet config_key "smtp_helo" %}}

String, the HELO or EHLO value to send to the remote SMTP server.  Some SMTP services (like Google Workspace/Gmail SMTP relay) require a value that isn't `localhost` to be set here.

**Default:** `"<hostname portion of app_baseURL>"`

{{% snippet config_key "smtp_hostname" %}}

String, hostname to use when connecting to SMTP server.

**Default:** `""`

{{% snippet config_key "smtp_password" %}}

String, password to use when connecting to SMTP server.

**Default:** `""`

{{% snippet config_key "smtp_port" %}}

Number, port to use when connecting to SMTP server.

**Default:** `587`

{{% snippet config_key "smtp_replyTo" %}}

String, email address to have users send to when replying.

**Default:** `""`

{{% snippet config_key "smtp_requireTLS" %}}

Boolean, require a valid TLS certificate for all outgoing SMTP requests.

**default:** `false`

{{% snippet config_key "smtp_username" %}}

String, username to use when connecting to SMTP server.

**Default:** `""`

{{% snippet config_key "webPush" %}}

Homechart can use [Web Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) to send push notifications from Homechart to your devices.  Homechart communicates directly to web push services provided by Apple, Google, Mozilla and other standards-compliant endpoints.  Additionally, all of the data in the push notification is encrypted between your server and the client--the web push services can't read it.

You need to generate the VAPID private key to use Web Push.  Homechart will do this automatically and store the key in the database, but you can also generate a key from the command line, e.g.:

```shell
$ ./homechart_linux_amd64 generate-vapid
VEIYXV6qF_enUzycyQYdplDUgi05UM4lPh_FTzYmwX8
```

Or using a container:

```shell
$ docker run -it --rm ghcr.io/candiddev/homechart generate-vapid
VEIYXV6qF_enUzycyQYdplDUgi05UM4lPh_FTzYmwX8
```

This command will output the private key you'll use in the configuration sections below.

{{% snippet config_key "webPush_vapidPrivateKey" %}}

String, the privateKey value from running `generate-vapid`.  Will be automatically generated by Homechart if one isn't provided.

**Default:** `""`
