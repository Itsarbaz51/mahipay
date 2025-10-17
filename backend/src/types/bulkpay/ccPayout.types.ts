import type { TxStatus } from "@prisma/client";

export enum CardType {
  VISA = "VISA",
  RUPAY = "RUPAY",
  MASTER = "MASTER",
}

export enum SenderStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export enum BeneficiaryStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
}

export enum CollectionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PROCESSING = "PROCESSING",
  CANCELLED = "CANCELLED",
}

export enum SettlementType {
  INSTANT = "INSTANT",
  T_PLUS_1 = "T_PLUS_1",
}

// Sender Types
export interface CCSender {
  id: string;
  senderId: string;
  referenceId: string;
  userId: string;
  name: string;
  nameInPan: string;
  pan: string;
  aadhar?: string;
  phone: string;
  cardNo: string;
  cvv: string;
  expiry: string;
  cardFrontImage?: string;
  cardBackImage?: string;
  cardType: CardType;
  charge?: number;
  gst?: number;
  isActive: boolean;
  status: SenderStatus;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface UpdateSenderInput {
  cardFrontImage?: string;
  cardBackImage?: string;
  status?: SenderStatus;
}

export interface ListSendersQuery {
  page?: number;
  limit?: number;
  referenceId?: string;
  senderId?: string;
}

// Beneficiary Types
export interface CCBeneficiary {
  id: string;
  beneficiaryId: string;
  reference: string;
  userId: string;
  name: string;
  accountHolderName?: string;
  accountNumber: string;
  ifsc: string;
  status: BeneficiaryStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBeneficiaryInput {
  reference: string;
  name: string;
  accountNumber: string;
  ifsc: string;
}

export interface ListBeneficiariesQuery {
  page?: number;
  limit?: number;
  status?: BeneficiaryStatus;
  reference?: string;
  beneficiaryId?: string;
}

// Collection Types
export interface CCCollection {
  id: string;
  collectionId: string;
  reference: string;
  userId: string;
  senderId: string;
  beneficiaryId: string;
  amount: number;
  type: SettlementType;
  redirectUrl: string;
  cardType: CardType;
  additionalCharge?: number;
  collectionUrl?: string;
  status: CollectionStatus;
  message?: string;
  utr?: string;
  charge?: number;
  gst?: number;
  createdAt: Date;
  updatedAt: Date;
  payouts: CCPayout[];
}

export interface CreateCollectionInput {
  reference: string;
  beneficiaryId: string;
  senderId: string;
  amount: number;
  type: SettlementType;
  redirectUrl: string;
  cardType: CardType;
  additionalCharge?: number;
}

export interface ListCollectionsQuery {
  page?: number;
  limit?: number;
  beneficiaryId?: string;
  reference?: string;
  collectionId?: string;
}

// Payout Types
export interface CCPayout {
  id: string;
  collectionId: string;
  transactionId: string;
  amount: number;
  accountNumber: string;
  ifsc: string;
  beneficiaryName: string;
  status: TxStatus;
  message?: string;
  paymentMode: string;
  utr?: string;
  holderName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bulkpe API Response Types
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
}

export interface BulkpeCollectionResponse {
  collectionId: string;
  reference: string;
  amount: number;
  status: string;
  message: string;
  utr: string;
  senderId: string;
  beneficiaryId: string;
  collectionUrl: string;
  createdAt: string;
  updatedAt: string;
  type: number;
  charge: number;
  gst: number;
  additionalCharge: number;
  payouts: Array<{
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
  }>;
}
