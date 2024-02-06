export enum PermissionEnum {
  Edit,
  View,
  None,
}

export enum PermissionComponentsEnum {
  Auth,
  Budget,
  Calendar,
  Cook,
  Health,
  Inventory,
  Notes,
  Plan,
  Reward,
  Secrets,
  Shop,
}

export const Permission = {
  components: [
    "auth",
    "budget",
    "calendar",
    "cook",
    "health",
    "inventory",
    "notes",
    "plan",
    "reward",
    "secrets",
    "shop",
  ],
  isPermitted: (
    permissions: PermissionsHousehold[] | null,
    cmp: PermissionComponentsEnum,
    p: PermissionEnum,
    authHouseholdID?: NullUUID,
  ): boolean => {
    if (permissions !== null) {
      for (const permission of permissions) {
        if (
          permission.permissions[Permission.components[cmp]] <= p &&
          (authHouseholdID === undefined ||
            permission.authHouseholdID === authHouseholdID)
        ) {
          return true;
        }
      }
    }

    return false;
  },
  new: (): Permissions => {
    return {
      auth: PermissionEnum.Edit,
      budget: PermissionEnum.Edit,
      calendar: PermissionEnum.Edit,
      cook: PermissionEnum.Edit,
      health: PermissionEnum.Edit,
      inventory: PermissionEnum.Edit,
      notes: PermissionEnum.Edit,
      plan: PermissionEnum.Edit,
      reward: PermissionEnum.Edit,
      secrets: PermissionEnum.Edit,
      shop: PermissionEnum.Edit,
    };
  },
};

/* eslint-disable jsdoc/require-jsdoc */
export interface Permissions {
  [key: string]: PermissionEnum;
  auth: PermissionEnum;
  budget: PermissionEnum;
  calendar: PermissionEnum;
  cook: PermissionEnum;
  health: PermissionEnum;
  inventory: PermissionEnum;
  notes: PermissionEnum;
  plan: PermissionEnum;
  reward: PermissionEnum;
  secrets: PermissionEnum;
  shop: PermissionEnum;
}

export interface PermissionsHousehold {
  authHouseholdID: NullUUID;
  permissions: Permissions;
}
