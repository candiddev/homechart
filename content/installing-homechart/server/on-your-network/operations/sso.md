---
title: Single Sign-On (SSO)
---

# Single Sign-On (SSO)

For self-hosted users, Homechart can integrate with your existing authentication system to allow your household members to authenticate with it or even sign in automatically.  Some things to note:

- The account will be created if the email address does not exist in Homechart already.  You should pre-create your household members using the email address that the SSO will pass through, otherwise they will be created under a separate household.
- If the account already exists in Homechart, Homechart will create a new session for the account associated with the email address that the SSO passes.  **Please ensure you have properly configured your SSO implementation to avoid malicious users from setting the proxy headers and gaining access to your instance.**
- At a minimum, you must have the appropriate configuration values set for [HOMECHART_APP_PROXYADDRESS](/installing-homechart/server/on-your-network/installation/configuration-options/#app-proxyaddress) and [HOMECHART_APP_PROXYHEADEREMAIL](/installing-homechart/server/on-your-network/installation/configuration-options/#app-proxyheaderemail) to enable SSO.

## Examples

### Traefik + Authelia + Homechart

In this example, [Traefik](https://github.com/traefik/traefik) sits in front of Homechart and proxies request to it.  [Authelia](https://github.com/authelia/authelia) is installed and configured for authentication within Traefik.  Traefik will check with Authelia to see if the traffic is allowed, and then pass the proxy headers to Homechart.  Homechart is configured to look for these proxy headers (`Remote-Name`, `Remote-Email`) and source address of Traefik.

In this contrived example, Authelia is configured with a local database of users.  On your network, you would configure Authelia to use your authentication source, such as LDAP/Active Directory.

#### Traefik Dynamic Config (traefik-dynamic.yaml)

```
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
```

#### Traefik Command Line

```
./traefik --entrypoints.https=true --entrypoints.https.address=:8443 --providers.file.filename=traefik-dynamic.yaml
```

#### Authelia Config (authelia.yaml)

```
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
```

#### Authelia User Config (users.yaml)

```
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
```

#### Authelia Command Line

```
./authelia-linux-amd64 --config authelia.yaml
```

#### Homechart Command Line

```
HOMECHART_APP_PROXYADDRESS=[::1] HOMECHART_APP_PROXYHEADEREMAIL=Remote-Email HOMECHART_APP_PROXYHEADERNAME=Remote-Name ./homechart_linux_amd64 -c config.json serve
```
