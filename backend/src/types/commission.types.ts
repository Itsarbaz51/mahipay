// types/commission.types.ts
import type { CommissionType, CommissionScope } from "@prisma/client";

export interface CreateOrUpdateCommissionSetting {
  scope: CommissionScope;
  roleId?: string;
  targetUserId?: string;
  serviceId?: string;
  commissionType: CommissionType;
  commissionValue: number;
  minAmount?: number;
  maxAmount?: number;
  applyTDS?: boolean;
  tdsPercent?: number;
  applyGST?: boolean;
  gstPercent?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

export interface CreateCommissionEarning {
  userId: string;
  fromUserId?: string;
  serviceId?: string;
  transactionId: string;
  amount: number;
  commissionAmount: number;
  commissionType: CommissionType;
  tdsAmount?: number;
  gstAmount?: number;
  netAmount: number;
  metadata?: any;
  createdBy: string;
}