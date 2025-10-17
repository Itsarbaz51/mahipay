import type { Request } from "express";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    roleLevel?: number;
  };
}

export interface User {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string;
  email: string;
  password: string;
  phoneNumber: string;
  // domainName: string;
  isAuthorized: boolean;
  status: "ACTIVE" | "IN_ACTIVE" | "DELETE";
  isKycVerified: boolean;
  roleId: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;

  role?: {
    id: string;
    name: string;
    level: number;
  };

  wallets?: {
    id: string;
    balance: bigint | string;
    currency: string;
    isPrimary: boolean;
  }[];

  parent?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;

  children?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  }[];

  hierarchyLevel: number;
  hierarchyPath: string;
}

export interface RegisterPayload {
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  transactionPin: string;
  // domainName: string;
  password: string;
  confirmPassword?: string;
  roleId: string;
  parentId: string;
}

export interface JwtInput {
  id: string;
  email: string;
  role: string;
  roleLevel: number;
}

export interface JwtPayload extends JwtInput {
  jti?: string;
  exp?: number; // optional
  iat?: number;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}
