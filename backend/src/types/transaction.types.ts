export interface CreateTransactionDTO {
  userId: string;
  walletId: string;
  serviceId?: string;
  apiEntityId?: string;
  amount: number | bigint;
  currency?: string;
  moduleType: string;
  subModule?: string;
  paymentType: string;
  commissionAmount?: number | bigint;
  taxAmount?: number | bigint;
  feeAmount?: number | bigint;
  cashbackAmount?: number | bigint;
  idempotencyKey?: string;
  referenceId?: string;
  externalRefId?: string;
  requestPayload?: object;
  metadata?: object;
}

export interface RefundTransactionDTO {
  transactionId: string;
  initiatedBy: string;
  amount: number | bigint;
  reason?: string;
  metadata?: object;
}

export interface UpdateTransactionStatusDTO {
  transactionId: string;
  status:
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "REVERSED"
    | "REFUNDED"
    | "CANCELLED";
  providerReference?: string;
  providerResponse?: object;
  responsePayload?: object;
}

export interface GetTransactionsFilters {
  userId?: string;
  status?: string;
  serviceId?: string;
  apiEntityId?: string;
  moduleType?: string;
  paymentType?: string;
  page: number;
  limit: number;
}
