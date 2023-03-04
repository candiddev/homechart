# Configuration Options

Homechart can be configured using environment variables or a JSON configuration file.  The configuration is divided into sections:

- <a href="#app">App</a>
- <a href="#cli">App</a>
- <a href="#postgresql">PostgreSQL</a>
- <a href="#smtp">SMTP</a>
- <a href="#vault">Vault</a>

**For environment variables**, every configuration key can be set using `HOMECHART_<SECTION>_<KEY>=a value`, i.e. `HOMECHART_CLI_DEBUG=true`

**For a JSON or YAML configuration file**, the keys are camelCase and nested under each section:

_JSON_
```json
{
  "app": {
    "baseURL": "example.com"
  }
}
```

_YAML_
```yaml
app:
  baseURL: example.com
```

Configuration values can be booleans (true/false), integers (1/2/3), lists (1,2,3/a,b,c), and strings (a/b/c).

Homechart can also read configuration files from HashiCorp Vault.  See <a href="#vault">Vault</a>.

## app

### adminEmailAddresses (recommended)

List of email addresses which will have admin access to Homechart for their account.

```
Type: List
Default: []
Environment Variable: HOMECHART_APP_ADMINEMAILADDRESSES
JSON: {"app": {"adminEmailAddresses": []}}
```

### baseURL (recommended)

Base URL for Homechart, mostly used by notifications.

```
Type: string
Default: "https://web.homechart.app"
Environment Variable: HOMECHART_APP_BASEURL
JSON: {"app": {"baseURL": "https://web.homechart.app"}}
```

### cacheTTLMinutes

Number of minutes to keep entries in cache.

```
Type: integer
Default: 15
Environment Variable: HOMECHART_APP_CACHETTLMINUTES
JSON: {"app": {"cacheTTLMinutes": 15}}
```

### demo

Allow users to create demo logins, mostly used by web.homechart.app.  Easy way to try out Homechart.

```
Type: boolean
Default: false
Environment Variable: HOMECHART_APP_DEMO
JSON: {"app": {"demo": false}}
```

### disableTasks

Disable any background tasks (sending notifications, cleaning up old data) from running on this instance.

```
Type: boolean
Default: false
Environment Variable: HOMECHART_APP_DISABLETASKS
JSON: {"app": {"disableTasks": false}}
```

### keepCalendarEventDays

Number of days to retain Calendar Events after their end date.

```
Type: integer
Default: 90
Environment Variable: HOMECHART_APP_KEEPCALENDAREVENTDAYS
JSON: {"app": {"keepCalendarEventDays": 90}}
```

### keepCookMealPlanDays

Number of days to retain Cook Meal Plans after their scheduled date.

```
Type: integer
Default: 90
Environment Variable: HOMECHART_APP_KEEPCOOKMEALPLANDAYS
JSON: {"app": {"keepCookMealPlanDays": 90}}
```

### keepDeletedDays

Number of days to keep deleted data (Notes, Recipes).

```
Type: integer
Default: 30
Environment Variable: HOMECHART_APP_KEEPDELETEDDAYS
JSON: {"app": {"keepDeletedDays": 30}}
```
### keepHealthLogDays

Number of days to retain Health Logs.

```
Type: integer
Default: 90
Environment Variable: HOMECHART_APP_KEEPHEALTHLOGDAYS
JSON: {"app": {"keepHealthLogDays": 90}}
```

### keepNotesPageVersions

Number of Notes Page Versions to keep.

```
Type: integer
Default: 10
Environment Variable: HOMECHART_APP_KEEPNOTESPAGEVERSIONS
JSON: {"app": {"keepNotesPageVersions": 10}}
```

### keepPlanTasksDays

Number of days to keep completed tasks.

```
Type: integer
Default: 90
Environment Variable: HOMECHART_APP_KEEPPLANTASKSDAYS
JSON: {"app": {"keepPlanTasksDays": 90}}
```

### motd

Informational message to display on the UI for all users.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_MOTD
JSON: {"app": {"motd": ""}}
```

### port {#app-port}

Listening port for Homechart.  Setup port forwarding to this port.

```
Type: integer
Default: 3000
Environment Variable: HOMECHART_APP_PORT
JSON: {"app": {"port": 3000}}
```

### proxyAddress {#app-proxyaddress}

Upstream IPv4 or IPv6 address of a trusted proxy.  See <a href="/getting-started/on-your-network/operations/sso/">SSO documentation</a> for usage details.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_PROXYADDRESS
JSON: {"app": {"proxyAddress": ""}}
```

### proxyHeaderEmail {#app-proxyheaderemail}

Proxy header that should be associated with an account email address.  See <a href="/getting-started/on-your-network/operations/sso/">SSO documentation</a> for usage details.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_PROXYHEADEREMAIL
JSON: {"app": {"proxyHeaderEmail": ""}}
```

### proxyHeaderName {#app-proxyheadername}

Proxy header that should be associated with an account name.  See <a href="/getting-started/on-your-network/operations/sso/">SSO documentation</a> for usage details.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_PROXYHEADERNAME
JSON: {"app": {"proxyHeaderName": ""}}
```

### rateLimiterRate

Maximum number of requests over a specific time to public endpoints.  Prevents brute force attacks.  Takes the format of (number-H/M/S) where H=hour, M=minute, S=Second.  The default, 15-H, means 15 requests per hour.

```
Type: string
Default: "15-H"
Environment Variable: HOMECHART_APP_RATELIMITERRATE
JSON: {"app": {"rateLimiterRate": "15-H"}}
```

### rollupBudgetTransactionsBalanceMonths

Number of months before a Budget Transaction is rolled up into a starting balance.

```
Type: integer
Default: 48
Environment Variable: HOMECHART_APP_ROLLUPBUDGETTRANSACTIONSBALANCEMONTHS
JSON: {"app": {"rollupBudgetTransactionsBalanceMonths": 48}}
```

### rollupBudgetTransactionsSummaryMonths

Number of months before a Budget Transaction is rolled up into monthly summaries.

```
Type: integer
Default: 12
Environment Variable: HOMECHART_APP_ROLLUPBUDGETTRANSACTIONSSUMMARYMONTHS
JSON: {"app": {"rollupBudgetTransactionsSummaryMonths": 12}}
```

### sessionExpirationDefaultSeconds

Time between non-Remember Me sessions expiring, in seconds.

```
Type: integer
Default: 3600
Environment Variable: HOMECHART_APP_SESSIONEXPIRATIONDEFAULTSECONDS
JSON: {"app": {"sessionExpirationDefaultSeconds": 3600}}
```

### sessionExpirationRememberSeconds

Time between Remember Me sessions expiring, in seconds.

```
Type: integer
Default: 7776000
Environment Variable: HOMECHART_APP_SESSIONEXPIRATIONREMEMBERSECONDS
JSON: {"app": {"sessionExpirationRememberSeconds": 7776000}}
```

### signupDisabled

Disables new account signups.  Accounts can still be created/invited under the Admin > Household page and Settings > Household.  Self-hosted instances should enable this after they have setup their household.

```
Type: boolean
Default: false
Environment Variable: HOMECHART_APP_SIGNUPDISABLED
JSON: {"app": {"signupDisabled": false}}
```

### tlsCertificate

Path to a SSL/TLS certificate file.  Should work for the domain in your <a href="#baseURL">baseURL</a>.  If set, along with <a href="#tlsKey">tlsKey</a>, Homechart will listen for HTTPS connections only.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_TLSCERTIFICATE
JSON: {"app": {"tlsCertificate": ""}}
```

### tlsKey

Path to a SSL/TLS private key file.  Should work for the domain in your <a href="#baseURL">baseURL</a>.  If set, along with <a href="#tlsCertificate">tlsCertificate</a>), Homechart will listen for HTTPS connections only.

```
Type: string
Default: ""
Environment Variable: HOMECHART_APP_TLSKEY
JSON: {"app": {"tlsKey": ""}}
```

## cli

### debug

Enable debug logging.

```
Type: boolean
Default: false
Environment Variable: HOMECHART_CLI_DEBUG
JSON: {"cli": {"debug": false}}
```

### noColor

Disable colored logging

```
Type: boolean
Default: false
Environment Variable: HOMECHART_CLI_NOCOLOR
JSON: {"cli": {"noColor": false}}
```

## postgresql

### database (required)

Database to use when connecting to PostgreSQL.

```
Type: string
Default: ""
Environment Variable: HOMECHART_POSTGRESQL_DATABASE
JSON: {"postgresql": {"database": ""}}
```

### hostname (required) {#postgresql-hostname}

Hostname to use when connecting to PostgreSQL.

```
Type: string
Default: "localhost"
Environment Variable: HOMECHART_POSTGRESQL_HOSTNAME
JSON: {"postgresql": {"hostname": "localhost"}}
```

### maxConnections

Maximum number of open connections to PostgreSQL.

```
Type: integer
Default: 25
Environment Variable: HOMECHART_POSTGRESQL_MAXCONNECTIONS
JSON: {"postgresql": {"maxConnections": 25}}
```

### maxIdleConnections

Maximum number of idle connections to PostgreSQL.

```
Type: integer
Default: 5
Environment Variable: HOMECHART_POSTGRESQL_MAXIDLECONNECTIONS
JSON: {"postgresql": {"maxIdleConnections": 5}}
```

### maxLifetimeMinutes

Maximum number of minutes to keep a connection to PostgreSQL open.

```
Type: integer
Default: 5
Environment Variable: HOMECHART_POSTGRESQL_MAXLIFETIMEMINUTES
JSON: {"postgresql": {"maxLifetimeMinutes": 5}}
```

### password (required) {#postgresql-password}

Password to use when connecting to PostgreSQL.

```
Type: string
Default: ""
Environment Variable: HOMECHART_POSTGRESQL_PASSWORD
JSON: {"postgresql": {"password": ""}}
```

### port {#postgresql-port}

TCP port to use when connecting to PostgreSQL.

```
Type: integer
Default: 5432
Environment Variable: HOMECHART_POSTGRESQL_PORT
JSON: {"postgresql": {"port": 5432}}
```

### sslMode

PostgreSQL SSL/TLS enforcement level.

```
Type: string
Default: "disable"
Environment Variable: HOMECHART_POSTGRESQL_SSLMODE
JSON: {"postgresql": {"sslMode": "disable"}}
```

### username (required) {#postgresql-username}

Username to use when connecting to PostgreSQL.

```
Type: string
Default: ""
Environment Variable: HOMECHART_POSTGRESQL_USERNAME
JSON: {"postgresql": {"username": ""}}
```

## smtp

Homechart can use a SMTP server to send notifications to your household members.

### fromAddress

Email address to send from.  Required to make SMTP work.

```
Type: string
Default: ""
Environment Variable: HOMECHART_SMTP_FROMADDRESS
JSON: {"smtp": {"fromAddress": ""}}
```

### hostname {#smtp-hostname}

Hostname to use when connecting to SMTP server.

```
Type: string
Default: ""
Environment Variable: HOMECHART_SMTP_HOSTNAME
JSON: {"smtp": {"hostname": ""}}
```

### noEmailDomains

List of domains that will not be verified.  Use this to automatically activate accounts for each domain listed.

```
Type: list
Default: []
Environment Variable: HOMECHART_APP_NOEMAILDOMAINS
JSON: {"app": {"noEmailDomains": []}}
```

### password {#smtp-password}

Password to use when connecting to SMTP server.

```
Type: string
Default: ""
Environment Variable: HOMECHART_SMTP_PASSWORD
JSON: {"smtp": {"password": ""}}
```

### port {#smtp-port}

TCP port to use when connecting to SMTP server.

```
Type: integer
Default: 587
Environment Variable: HOMECHART_SMTP_PORT
JSON: {"smtp": {"port": 587}}
```

### replyTo

Email address to have users send to when replying.

```
Type: string
Default: ""
Environment Variable: HOMECHART_SMTP_REPLYTO
JSON: {"smtp": {"replyTo": ""}}
```

### username {#smtp-username}

Username to use when connecting to SMTP server.

```
Type: string
Default: ""
Environment Variable: HOMECHART_SMTP_USERNAME
JSON: {"smtp": {"username": ""}}
```

## vault

Homechart can use [HashiCorp Vault](https://www.vaultproject.io) to retrieve configuration values.  Homechart will look for specified kv secrets and read config values from fields within them.  The fields must have the format:

- `<section>.<key>`
- `app.disabletasks`

The field name must be lowercase.  In theory, you can specify every config in Vault except the Vault stanza, Homechart needs to know where to get the Vault config from.

### address

Address of the HashiCorp Vault instance to use for secrets, also checks the VAULT_ADDR environment variable.

```
Type: string
Default: ""
Environment Variable: HOMECHART_VAULT_ADDRESS
JSON: {"vault": {"address": ""}}
```

### kvPaths

List of HashiCorp Vault kv2 paths to fetch config values from.  Secrets must have lowercase fields like `postgresql.database` or `smtp.username`.  Paths will overwrite values from previous paths, so the order is important.

```
Type: list
Default: []
Environment Variable: HOMECHART_VAULT_KVPATHS
JSON: {"vault": {"kvPaths": []}}
```

### token

HashiCorp Vault token to use for secrets, also checks VAULT_TOKEN.

```
Type: string
Default: ""
Environment Variable: HOMECHART_VAULT_TOKEN
JSON: {"vault": {"token": ""}}
```
