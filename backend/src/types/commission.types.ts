import type { CommissionType } from "@prisma/client";

export interface CreateOrUpdateCommissionSetting {
  scope: "ROLE" | "USER";
  roleId?: string;
  targetUserId?: string;
  serviceId: string;
  commissionType: "FLAT" | "PERCENT";
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
  fromUserId: string;
  serviceId: string;
  transactionId: string;
  amount: number | string;
  commissionAmount: number | string;
  commissionType: CommissionType; // Enum in Prisma (CommissionType)
  level: number;
  createdBy: string;
}
