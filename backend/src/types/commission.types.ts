import type {
  CommissionType,
  CommissionScope,
  ModuleType,
} from "@prisma/client";

export interface CreateOrUpdateCommissionSetting {
  scope: CommissionScope;
  roleId?: string;
  targetUserId?: string;
  serviceId?: string;
  moduleType: ModuleType;
  subModule?: string;
  commissionType: CommissionType;
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  minUserLevel?: number;
  applyTDS?: boolean;
  tdsPercent?: number;
  applyGST?: boolean;
  gstPercent?: number;
  channel?: string;
  userLevel?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

export interface CreateCommissionEarning {
  userId: string;
  fromUserId?: string;
  serviceId?: string;
  transactionId: string;
  moduleType: ModuleType;
  subModule?: string;
  amount: number | string;
  commissionAmount: number | string;
  commissionType: CommissionType;
  level: number;
  tdsAmount?: number | string;
  gstAmount?: number | string;
  netAmount: number | string;
  createdBy: string;
}
