export interface RolePermissionPayload {
  roleId?: string;
  userId?: string;
  serviceId: string;
  canView: boolean;
  canEdit: boolean;
  canSetCommission: boolean;
}

export interface CheckRolePermissionPayload {
  roleId: string;
  serviceId: string;
  canView?: boolean;
  canEdit?: boolean;
  canSetCommission?: boolean;
}

export interface CheckUserPermissionPayload {
  userId: string;
  serviceId: string;
  canView?: boolean;
  canEdit?: boolean;
  canSetCommission?: boolean;
}
