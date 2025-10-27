import { AccountType } from "@prisma/client";

export interface BankDetailInput {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  phoneNumber: string;
  accountType: AccountType;
  bankProofFile?: Express.Multer.File;
  bankId?: string;
  userId: string;
  isPrimary?: boolean;
}

export interface BankDetail {
  id: string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  phoneNumber: string;
  accountType: AccountType;
  bankProofFile?: string;
  bankId?: string;
  userId: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}