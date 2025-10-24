export interface RolePermissionPayload {
  roleId?: string;
  userId?: string;
  serviceIds: string[];
  canView: boolean;
  canEdit: boolean;
  canSetCommission: boolean;
}

export interface CheckRolePermissionPayload {
  roleId: string;
  serviceIds: string[];
  canView?: boolean;
  canEdit?: boolean;
  canSetCommission?: boolean;
}

export interface CheckUserPermissionPayload {
  userId: string;
  serviceIds: string[];
  canView?: boolean;
  canEdit?: boolean;
  canSetCommission?: boolean;
}
