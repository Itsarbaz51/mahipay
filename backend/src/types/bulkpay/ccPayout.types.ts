// src/types/bulkpay/ccPayout.types.ts
export interface CreateSenderInput {
  referenceId: string;
  name: string;
  pan: string;
  aadhar?: string;
  phone: string;
  cardNo: string;
  cvv: string;
  expiry: string;
}

export interface BulkpeSenderResponse {
  senderId: string;
  referenceId: string;
  nameInPan: string;
  pan: string;
  name: string;
  aadharNumber: string;
  mobile: string;
  cardNumber: string;
  charge: number;
  gst: number;
  isActive: boolean;
  [key: string]: any; // Add index signature for JSON compatibility
}

export interface CreateBeneficiaryInput {
  reference: string;
  name: string;
  accountNumber: string;
  ifsc: string;
}

export interface BulkpeBeneficiaryResponse {
  reference: string;
  beneficiaryId: string;
  beneficiaryName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  status: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // Add index signature for JSON compatibility
}

export interface CreateCollectionInput {
  reference: string;
  beneficiaryId: string;
  senderId: string;
  amount: number;
  type: 1 | 2; // 1 for instant, 2 for T+1
  redirectUrl: string;
  cardType: "visa" | "rupay" | "master";
  additionalCharge?: number;
}

export interface BulkpeCollectionResponse {
  collectionId: string;
  reference: string;
  amount: number;
  status: string;
  message: string;
  utr: string;
  senderId: string;
  collectionUrl: string;
  createdAt: string;
  updatedAt: string;
  type: 1 | 2;
  charge: number;
  gst: number;
  payouts: PayoutDetail[];
  [key: string]: any; // Add index signature for JSON compatibility
}

export interface PayoutDetail {
  transactionId: string;
  amount: number;
  accountNumber: string;
  ifsc: string;
  beneficiaryName: string;
  status: string;
  message: string;
  paymentMode: string;
  utr: string;
  holderName: string;
  [key: string]: any; // Add index signature for JSON compatibility
}

export interface WebhookPayload {
  collectionId: string;
  status: "SUCCESS" | "FAILED" | "PENDING" | "PROCESSING";
  message: string;
  utr?: string;
  payouts: PayoutDetail[];
  timestamp: string;
  [key: string]: any; // Add index signature for JSON compatibility
}
