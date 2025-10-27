export interface RoleCreatePayload {
  name: string;
  description?: string | null;
  level?: number;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string | null;
  level?: number;
}

export interface RolePermissionDTO {
  id: string;
  service: {
    id: string;
    name: string | null;
    code: string;
    type: string;
    isActive: boolean;
  };
  canView: boolean;
  canEdit: boolean;
  canSetCommission: boolean;
  canProcess: boolean;
}

export interface RoleDTO {
  id: string;
  name: string;
  level: number;
  createdBy: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  userCount?: number;
  permissionCount?: number;
  permissions?: RolePermissionDTO[];
}

export interface RoleListResponse {
  roles: RoleDTO[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}