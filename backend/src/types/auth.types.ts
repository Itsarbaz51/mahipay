import type {
  UserStatus,
  Currency,
  WalletType,
  AccountType,
  Gender,
  KycStatus,
} from "@prisma/client";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  roleLevel: number;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    roleLevel: number;
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

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // Auth fields
  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  emailVerificationToken: string | null;
  emailVerifiedAt: Date | null;
  emailVerificationTokenExpires: Date | null;

  // Relations
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

  // Make these fields optional in relations since we don't always need them
  parent?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string; // Make optional
    profileImage?: string; // Make optional
  } | null;

  children?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string; // Make optional
    profileImage?: string; // Make optional
    status?: UserStatus; // Make optional
    createdAt?: Date; // Make optional
  }[];

  // KYC Information
  kycInfo?: {
    currentStatus: KycStatus | "NOT_SUBMITTED";
    isKycSubmitted: boolean;
    latestKyc?: {
      id: string;
      firstName: string;
      lastName: string;
      fatherName: string;
      dob: Date;
      gender: Gender;
      status: KycStatus;
      kycRejectionReason?: string | null;
      address: {
        id: string;
        address: string;
        pinCode: string;
        state: {
          id: string;
          stateName: string;
          stateCode: string;
        };
        city: {
          id: string;
          cityName: string;
          cityCode: string;
        };
      };
      panFile: string;
      aadhaarFile: string;
      addressProofFile: string;
      photo: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    kycHistory: any[];
    totalKycAttempts: number;
  };

  // Bank Information
  bankInfo?: {
    totalAccounts: number;
    primaryAccount?: {
      id: string;
      accountHolder: string;
      accountNumber: string;
      phoneNumber: string;
      accountType: AccountType;
      bankProofFile: string;
      isVerified: boolean;
      isPrimary: boolean;
      bank: {
        id: string;
        bankName: string;
        ifscCode: string;
        bankIcon: string;
      };
    } | null;
    verifiedAccounts: any[];
  };

  // Permissions
  userPermissions?: {
    id: string;
    serviceId: string;
    moduleTypes: string;
    canView: boolean;
    canEdit: boolean;
    canSetCommission: boolean;
    canProcess: boolean;
    limits: any;
    service: {
      id: string;
      name?: string;
      type: string;
      code: string;
    };
  }[];

  // PII Consents
  piiConsents?: {
    id: string;
    piiType: string;
    scope: string;
    providedAt: Date;
    expiresAt: Date;
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
