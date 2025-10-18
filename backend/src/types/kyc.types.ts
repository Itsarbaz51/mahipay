import type { Address } from "./address.types.js";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface UserKycUploadInput {
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  gender: Gender;
  dob: Date | string;
  addressId: string;
  panNumber: string;
  aadhaarNumber: string;

  photo: Express.Multer.File;
  panFile: Express.Multer.File;
  aadhaarFile: Express.Multer.File;
  addressProofFile: Express.Multer.File;
}

export interface UserKyc {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: Date;
  gender: Gender;
  photo: string;
  addressId: string;
  address?: Address;
  kycRejectionReason?: string;
  panFile: string;
  aadhaarFile: string;
  addressProofFile: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PiiConsentInput {
  userId: string;
  userKycId?: string | null;
  piiType: string;
  piiHash: string;
  providedAt: Date;
  expiresAt: Date;
  scope: string;
}

import { KycStatus as PrismaKycStatus } from "@prisma/client";

export interface KycVerificationInput {
  id: string;
  status: PrismaKycStatus;
  kycRejectionReason?: string;
}

export interface FilterParams {
  userId: string;
  status?: "VERIFIED" | "REJECT" | "PENDING" | "ALL";
  page: number;
  limit: number;
  sort: "asc" | "desc";
  search?: string;
}
