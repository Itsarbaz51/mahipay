export interface CreateTransactionDTO {
  userId: string;
  walletId: string;
  serviceId: string;
  providerId?: string;
  amount: number | bigint;
  commissionAmount: number | bigint;
  idempotencyKey?: string;
  referenceId?: string;
  requestPayload?: object;
}

export interface RefundTransactionDTO {
  transactionId: string;
  initiatedBy: string;
  amount: number | bigint;
  reason: string;
}

export interface UpdateTransactionStatusDTO {
  transactionId: string;
  status: "SUCCESS" | "FAILED";
  responsePayload?: object;
}

export interface GetTransactionsFilters {
  userId?: string;
  status?: string;
  serviceId?: string;
  page: number;
  limit: number;
}
