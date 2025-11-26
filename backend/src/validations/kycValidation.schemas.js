import { z } from "zod";

export const getAllKycSchema = z.object({
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

export const getKycByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid KYC ID format"),
  }),
});

export const createKycSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name too long"),
    fatherName: z
      .string()
      .min(1, "Father name is required")
      .max(100, "Father name too long"),
    dob: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    addressId: z.string().uuid("Invalid address ID"),
    panNumber: z
      .string()
      .length(10, "PAN number must be 10 characters")
      .regex(/[A-Z]{5}[0-9]{4}[A-Z]{1}/, "Invalid PAN format"),
    aadhaarNumber: z
      .string()
      .length(12, "Aadhaar number must be 12 characters")
      .regex(/^\d{12}$/, "Invalid Aadhaar format"),
  }),
});

export const updateKycSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid KYC ID format"),
  }),
  body: z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name too long")
      .optional(),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name too long")
      .optional(),
    fatherName: z
      .string()
      .min(1, "Father name is required")
      .max(100, "Father name too long")
      .optional(),
    dob: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format")
      .optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    addressId: z.string().uuid("Invalid address ID").optional(),
  }),
});

export const verifyKycSchema = z.object({
  body: z
    .object({
      id: z.string().uuid("Invalid KYC ID format"),
      status: z.enum(["VERIFIED", "REJECTED"]),
      kycRejectionReason: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.status === "REJECTED") {
          return !!data.kycRejectionReason?.trim();
        }
        return true;
      },
      {
        message: "Rejection reason is required when status is REJECTED",
        path: ["kycRejectionReason"],
      }
    ),
});

export const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  buffer: z.any(),
  size: z.number(),
});

export const kycFilesSchema = z
  .object({
    panFile: z.array(fileSchema).length(1, "PAN file is required"),
    aadhaarFile: z.array(fileSchema).length(1, "Aadhaar file is required"),
    addressProofFile: z
      .array(fileSchema)
      .length(1, "Address proof file is required"),
    photo: z.array(fileSchema).length(1, "Photo is required"),
  })
  .refine(
    (files) => {
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      return Object.values(files).every((fileArray) =>
        fileArray.every((file) => allowedMimes.includes(file.mimetype))
      );
    },
    {
      message: "Only JPEG, PNG, JPG, and PDF files are allowed",
    }
  );
