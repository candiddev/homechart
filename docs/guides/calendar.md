---
categories:
- guide
description: Usage instructions for Calendar
title: Calendar
---

Calendar helps you see everything going on in your Household.

## Automatic Refresh

The Calendar screen will automatically refresh, making it perfect for a tablet or kiosk.  The refresh times are:

- **Every minute**: Update the current time
- **Every 30 minutes**: Update the current date range (e.g. if you flip to the next week, Calendar will move back to the current week automatically)

You can combine the Calendar view and [Session Permissions]({{% ref "/docs/guides/settings#session-permissions" %}}) to have a limited access, shared "digital calendar" on a tablet or other device.

## Calendars

Homechart can display multiple calendars.  By default, you will have a Calendar for your personal and household events, Budget > Transactions, Cook > Meal Plans, and Health > Item Logs.  You can add or import more Calendars by tapping **Add** > **Calendar**.

Once a Calendar has been created, you can hide/show or edit it by tapping **Calendars**.  To edit it, tap the edit button to the right.  For iCalendar feeds, you can manually refresh the feed by tapping **Refresh**, otherwise the iCalendar feed will refresh every hour.

Homechart can import calendars from various applications using iCalendar:

- For **Google Calendar**, go under **Settings** > **Calendar Settings** for the calendar you want to import.  Scroll down to the **Secret address in iCal format**, and copy the URL.  In Homechart, add a calendar with this URL as the iCalendar URL.  Homechart will import your Google Calendar, and periodically (every hour or so) refresh it with new changes.

We recommend the following iCalendar providers for additional Calendars like weather, holidays, or religious observances:

- https://weather-in-calendar.com
- https://www.officeholidays.com
- https://www.calendarlabs.com

## Events

Events are things that are happening within your household.

### Participants

Events can have participants, members of your household that will be at the event.  When this is set, only those members will be notified of the Event, and the Event will use the [household member's colors]({{< ref "/docs/guides/settings#household" >}}).

### Location and Travel

Adding a **Location** to the event will give you a handy Google Maps link for directions to the location.  You can also add **Travel Time** for an event to have Homechart calculate a **Leave By** time and notify you on when you need to leave.

### Recurring Events

Events can be recurring by ticking **Recurring** at the bottom.  You can then set the recurring schedule.

### Reminders

Events can send multiple reminders before the event starts or ends.  These can be added under **Reminders**.

## Export Calendars

Homechart can export your calendar for use with other calendaring applications via ICS/iCalendar Feed and CalDAV.

### Export ICS/iCalendar Feed

Homechart can export an ICS/iCalendar Feed that can be imported into other applications and refreshed periodically.  This method provides read-only access to your Homechart events and tasks.

1. Tap **Add > Export Calendar**.
2. Tap **Enable iCalendar**.
3. Copy the URls into your Calendar program.

### Export CalDAV

Homechart can integrate with CalDAV applications to enable read/write access to your Homechart calendars.

{{% alert title="CalDAV and Self-Hosting" color="info" %}}
For self-hosted users, you will probably need a valid SSL/TLS certificate on your Homechart instance for this to work.
{{% /alert %}}

To create a CalDAV username and password for your CalDAV application:

1. Tap **Add > Export Calendar**.
2. Add a more specific CalDAV Client Name.
3. Tap **Setup CalDAV**.
4. Note the CalDAV URL, Username, and Password.

Homechart has been tested and validated to work with these CalDAV clients.  Are we missing one that you use or are these clients not working?  Please contact us, we'll get it fixed.

#### Apple Calendar

1. Open **Settings**.
2. Tap **Calendar**.
3. Tap **Add Account**.
4. Tap **Other**.
5. Add the URL, Username, and Password from Homechart.

#### DavX

1. Tap **Add Account**.
2. Add the URL, Username, and Password from Homechart.

#### Mozilla Thunderbird

1. Under Calendar, tap **New Calendar**.
2. Tap **On the Network**.
2. Add the URL, Username, and Password from Homechart.

{{% alert title="CalDAV Conformance" color="info" %}}
Homechart does not support the full WebDAV/CalDAV spec.  The specific URLs/methods Homechart supports currently are:

```
PROPFIND /dav/calendars
PROPFIND /dav/calendars/{calendarID}/
REPORT /dav/calendars/{calendarID}/
  Supported Report Sets:
    - calendar-query
    - calendar-multiget
    - sync-collection
DELETE /dav/calendars/{calendarID}/{itemID}
PUT /dav/calendars/{calendarID}/{itemID}
PROPFIND /dav/principals/
PROPFIND /dav/principals/{principalID}/
```
{{% /alert %}}

## Integrations

Calendar integrates with:

- [Budget]({{< ref "/docs/guides/budget" >}}): Calendar will display **Budget > Recurring Transactions**
- [Cook]({{< ref "/docs/guides/plan" >}}): Calendar will manage your **Cook > Meal Plans**
- [Health]({{< ref "/docs/guides/health" >}}): Calendar will manage your **Health > Logs**
- [Plan]({{< ref "/docs/guides/plan" >}}): Calendar will display **Plan > Tasks**
- [Shop]({{< ref "/docs/guides/shop" >}}): Calendar can add your **Cook > Meal Plan** Ingredients to your **Shop > Pick Up** list
