import type { Request } from "express";
import type {
  UserStatus,
  Currency,
  WalletType,
  AccountType,
  Gender,
  KycStatus,
  KycTypes,
} from "@prisma/client";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  roleLevel?: number;
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
  firstName: string;
  lastName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  password: string;
  transactionPin: string;
  parentId: string | null;
  hierarchyLevel: number;
  hierarchyPath: string;
  status: UserStatus;
  isKycVerified: boolean;
  roleId: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  emailVerificationToken: string | null;
  emailVerifiedAt: Date | null;
  emailVerificationTokenExpires: Date | null;

  role?: {
    id: string;
    name: string;
    level: number;
    description?: string | null;
  };

  wallets?: {
    id: string;
    userId: string;
    balance: bigint | string;
    currency: Currency;
    walletType: WalletType;
    holdBalance: bigint | string;
    availableBalance: bigint | string;
    dailyLimit: bigint | string | null;
    monthlyLimit: bigint | string | null;
    perTransactionLimit: bigint | string | null;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }[];

  parent?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profileImage: string;
  } | null;

  children?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profileImage: string;
    status: UserStatus;
    createdAt: Date;
  }[];

  kycInfo?: {
    currentStatus: KycStatus | "NOT_SUBMITTED";
    isKycSubmitted: boolean;
    latestKyc?: {
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      fatherName: string;
      dob: Date;
      gender: Gender;
      status: KycStatus;
      type: KycTypes;
      kycRejectionReason?: string | null;
      addressId: string;
      panFile: string;
      aadhaarFile: string;
      addressProofFile: string;
      photo: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
      address: {
        id: string;
        address: string;
        pinCode: string;
        stateId: string;
        cityId: string;
        createdAt: Date;
        updatedAt: Date;
        state: {
          id: string;
          stateName: string;
          stateCode: string;
          createdAt: Date;
          updatedAt: Date;
        };
        city: {
          id: string;
          cityName: string;
          cityCode: string;
          createdAt: Date;
          updatedAt: Date;
        };
      };
    } | null;
    kycHistory: any[];
    totalKycAttempts: number;
  };

  bankInfo?: {
    totalAccounts: number;
    primaryAccount?: {
      id: string;
      accountHolder: string;
      accountNumber: string;
      phoneNumber: string;
      accountType: AccountType;
      ifscCode: string;
      bankName: string;
      bankProofFile: string;
      isVerified: boolean;
      isPrimary: boolean;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    } | null;
    verifiedAccounts: any[];
  };

  userPermissions?: {
    id: string;
    userId: string;
    serviceId: string;
    canView: boolean;
    canEdit: boolean;
    canSetCommission: boolean;
    canProcess: boolean;
    limits: any;
    createdAt: Date;
    updatedAt: Date;
    service: {
      id: string;
      type: string;
      code: string;
      name?: string | null;
      isActive: boolean;
      config: any;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
    };
  }[];

  piiConsents?: {
    id: string;
    userId: string;
    userKycId: string | null;
    piiType: string;
    piiHash: string;
    providedAt: Date;
    expiresAt: Date;
    scope: string;
    createdAt: Date;
  }[];
}

export interface RegisterPayload {
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  email: string;
  phoneNumber: string;
  transactionPin: string;
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
  exp?: number;
  iat?: number;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}
