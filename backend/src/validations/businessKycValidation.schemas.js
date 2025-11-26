// validations/businessKycValidation.schemas.js
import { z } from "zod";

export const getAllBusinessKycSchema = z.object({
  query: z.object({
    status: z
      .enum(["PENDING", "VERIFIED", "REJECTED", "HOLD", "ALL"])
      .optional()
      .default("ALL"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    search: z.string().optional(),
  }),
});

export const getBusinessKycByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Business KYC ID format"),
  }),
});

export const createBusinessKycSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid("Invalid user ID"),
      businessName: z
        .string()
        .min(1, "Business name is required")
        .max(255, "Business name too long"),
      businessType: z.enum([
        "PROPRIETORSHIP",
        "PARTNERSHIP",
        "PRIVATE_LIMITED",
      ]),
      addressId: z.string().uuid("Invalid address ID"),
      panNumber: z
        .string()
        .length(10, "PAN number must be 10 characters")
        .regex(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, "Invalid PAN format"),
      gstNumber: z
        .string()
        .min(15, "GST number must be at least 15 characters")
        .max(20, "GST number too long"),
      // Optional fields based on business type
      udhyamAadhar: z.string().optional(),
      cin: z.string().optional(),
      partnerKycNumbers: z.number().int().min(1).max(20).optional(),
      directorKycNumbers: z.number().int().min(1).max(20).optional().default(2),
    })
    .refine(
      (data) => {
        if (data.businessType === "PARTNERSHIP" && !data.partnerKycNumbers) {
          return false;
        }
        return true;
      },
      {
        message: "Partner KYC numbers are required for partnership business",
        path: ["partnerKycNumbers"],
      }
    ),
});

export const updateBusinessKycSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Business KYC ID format"),
  }),
  body: z.object({
    businessName: z
      .string()
      .min(1, "Business name is required")
      .max(255, "Business name too long")
      .optional(),
    businessType: z
      .enum(["PROPRIETORSHIP", "PARTNERSHIP", "PRIVATE_LIMITED"])
      .optional(),
    addressId: z.string().uuid("Invalid address ID").optional(),
    udhyamAadhar: z.string().optional(),
    cin: z.string().optional(),
    partnerKycNumbers: z.number().int().min(1).max(20).optional(),
    directorKycNumbers: z.number().int().min(1).max(20).optional(),
  }),
});

export const verifyBusinessKycSchema = z.object({
  body: z
    .object({
      id: z.string().uuid("Invalid Business KYC ID format"),
      status: z.enum(["VERIFIED", "REJECTED"]),
      rejectionReason: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.status === "REJECTED") {
          return !!data.rejectionReason?.trim();
        }
        return true;
      },
      {
        message: "Rejection reason is required when status is REJECTED",
        path: ["rejectionReason"],
      }
    ),
});

export const businessKycFilesSchema = z
  .object({
    panFile: z.array(z.any()).length(1, "PAN file is required"),
    gstFile: z.array(z.any()).length(1, "GST file is required"),
    udhyamAadhar: z.array(z.any()).optional(),
    brDoc: z.array(z.any()).optional(),
    partnershipDeed: z.array(z.any()).optional(),
    moaFile: z.array(z.any()).optional(),
    aoaFile: z.array(z.any()).optional(),
    directorShareholding: z.array(z.any()).optional(),
  })
  .refine(
    (files) => {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      return Object.values(files).every(
        (fileArray) =>
          !fileArray ||
          fileArray.every((file) => allowedMimes.includes(file.mimetype))
      );
    },
    {
      message: "Only JPEG, PNG, JPG, and PDF files are allowed",
    }
  );
