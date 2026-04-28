---
categories:
- guide
description: Usage instructions for Contacts
title: Contacts
---

Contacts helps you manage people, businesses, restaurants, and grocery stores for your Household.

## Address Books

Contacts > Address Books organize your Contacts.  Each account and household has a default Address Book, and additional Address Books can be added.  For Household Address Books, you can grant access to specific members of your household.

## Contacts

Contacts are how you store details for people, businesses, Restaurants for [Cook]({{< ref "/docs/guides/cook" >}}), Stores for [Shop]({{< ref "/docs/guides/shop" >}}), and more.  Contacts live within an Address Book, where they can be shared with others who have access to the Address Book.  Contacts can store many details about the person or place, and can also define settings for integrations like the default Budget > Category or the travel time for Cook > Meal Plans.

## Export Address Books

Homechart can export your address books for use with other contact applications via VCF/vCard Feed and CardDAV.

### Export VCF/vCard Feed

Homechart can export a VCF/vCard Feed that can be imported into other applications and refreshed periodically.  This method provides read-only access to your Homechart events and tasks.

1. Tap **Add > Export Address Book**.
2. Tap **Enable vCard**.
3. Copy the URls into your Contacts program.

### Export CardDAV

Homechart can integrate with CardDAV applications to enable read/write access to your Homechart address books.

{{% alert title="CardDAV and Self-Hosting" color="info" %}}
For self-hosted users, you will probably need a valid SSL/TLS certificate on your Homechart instance for this to work.
{{% /alert %}}

To create a CardDAV username and password for your CardDAV application:

1. Tap **Add > Export Address Book**.
2. Add a more specific CardDAV Client Name.
3. Tap **Setup CardDAV**.
4. Note the CardDAV URL, Username, and Password.

Homechart has been tested and validated to work with these CardDAV clients.  Are we missing one that you use or are these clients not working?  Please contact us, we'll get it fixed.

#### Apple Contacts

1. Open **Settings**.
2. Tap **Contacts**.
3. Tap **Add Account**.
4. Tap **Other**.
5. Add the URL, Username, and Password from Homechart.

#### DavX

1. Tap **Add Account**.
2. Add the URL, Username, and Password from Homechart.

#### Mozilla Thunderbird

1. Under Contacts, tap **Add CardDAV Address Book**.
2. Add the URL, Username, and Password from Homechart.

{{% alert title="CardDAV Conformance" color="info" %}}
Homechart does not support the full WebDAV/CardDAV spec.  The specific URLs/methods Homechart supports currently are:

```
PROPFIND /dav/address-books
PROPFIND /dav/address-books/{addressBookID}/
REPORT /dav/address-books/{addressBookID}/
  Supported Report Sets:
    - address-book-query
    - address-book-multiget
    - sync-collection
DELETE /dav/address-books/{addressBookID}/{contactID}
PUT /dav/address-books/{addressBookID}/{contactID}
PROPFIND /dav/principals/
PROPFIND /dav/principals/{principalID}/
```
{{% /alert %}}

## Integrations

Calendar integrates with:

- [Budget]({{< ref "/docs/guides/budget" >}}): Contacts are used as Payees for **Budget > Transactions**.
- [Cook]({{< ref "/docs/guides/cook" >}}): Contacts can be used as Restaurants for **Cook > Meal Plans**.
- [Shop]({{< ref "/docs/guides/shop" >}}): Contacts can be used as Stores for **Shop > Items**.
