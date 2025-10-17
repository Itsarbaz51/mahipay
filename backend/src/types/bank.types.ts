import { AccountType } from "@prisma/client";

export interface BankInput {
  bankName: string;
  ifscCode: string;
  bankIcon: string;
}

export interface BankDetailInput {
  accountHolder: string;
  accountNumber: string;
  phoneNumber: string;
  accountType: AccountType;
  bankProofFile?: Express.Multer.File;
  bankId: string;
  userId: string;
  isPrimary?: boolean;
}
export interface BankDetail {
  accountHolder: string;
  accountNumber: string;
  phoneNumber: string;
  accountType: AccountType;
  bankProofFile?: string;
  bankId: string;
  userId: string;
  isPrimary?: boolean;
}
