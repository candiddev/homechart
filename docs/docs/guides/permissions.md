---
categories:
- guide
description: Usage instructions for Permissions and Labels
title: Permissions
---

Homechart has a robust access control system that allows you to grant broad or granular permissions to your data in Homechart.

## Permissions

Permissions provide a way to allow or restrict access broadly to your data in Homechart.  They are configured under **Settings > Household** for Household permissions, and under **Settings > Sessions** for Account or Household permissions for a specific session/signin.

### Levels

Each "component" of Homechart (such as Budget, Cook, Inventory, Plan, etc) can have one of three permissions assigned to it:

- **Edit**: Read, create, update, and delete any object within the component
- **View**: Read any object within the component
- **None**: No access to the component

Certain components may grant **View** access to data that has been restricted:

- **Calendar > Events** will be viewable by all Household Members that are participants within the Event.  To restrict this, change the household Calendar Permissions for the session under **Settings > Sessions** to None.
- **Reward > Cards** will be viewable by all Household Members that are recipients of the Card.  To restrict this, change the household Reward Permissions for the session under **Settings > Sessions** to None.
- **Secrets > Vaults** will be viewable by all Household Members that are added to the Vault.  To restrict this, change the household Secrets Permissions for the session under **Settings > Sessions** to None.

### Inheritance

For Household Permissions, Permissions are applied at the Household Member level first, then the Session level.  Meaning a Session with Calendar Edit Permissions for a Household Member with Calendar View Permissions will have an effective permission of Calendar View.

Additionally, the **Settings** component cannot be restricted to None.  All Household Members and Sessions can view Settings.

## Labels

Labels can be used to grant granular permissions to Household members for various types of data.  By assigning a Label to an object, you can grant Household members Edit, View, or None access to the Label, which grants (or denies) them access to all objects with that Label.

For instance, a user can have the **None** Permission to Budget, but have specific Label Permissions to Budget Accounts.

Permissions applied at the Session level control Label Permissions.  If a Session has Budget None permissions, any Label permissions for Budget items would be ignored.

### Label Support

The following data types support Labels:

- **Bookmarks**
- **Budget > Accounts**
  - Grants Read/Create/Update/Delete to **Budget > Transactions** for the Account
- **Budget > Categories**
- **Budget > Payees**
- **Calendars**
- **Cook > Recipes**
- **Inventory > Collections**
- **Inventory > Items**
- **Notes > Pages**
- **Plan > Projects**
  - Grants Read/Create/Update/Delete to **Plan > Tasks** for the Project
- **Shop > Lists**
  - Grants Read/Create/Update/Delete to **Shop > Items** for the List
