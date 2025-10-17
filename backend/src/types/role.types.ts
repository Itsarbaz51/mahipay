export interface RoleCreatePayload {
  name: string;
  description?: string | null;
}

export interface RoleUpdatePayload {
  name: string;
  description?: string | null;
}

export interface RoleDTO {
  id: string;
  name: string;
  level: number;
  createdBy: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleListResponse {
  roles: RoleDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}