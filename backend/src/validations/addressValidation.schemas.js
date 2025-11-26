import { z } from "zod";

export const getAddressByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid address ID format"),
  }),
});

export const createAddressSchema = z.object({
  body: z.object({
    address: z
      .string()
      .min(1, "Address is required")
      .max(1000, "Address too long"),
    pinCode: z
      .string()
      .min(6, "PIN code must be 6 characters")
      .max(6, "PIN code must be 6 characters")
      .regex(/^\d{6}$/, "Invalid PIN code format"),
    stateId: z.string().uuid("Invalid state ID"),
    cityId: z.string().uuid("Invalid city ID"),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid address ID format"),
  }),
  body: z.object({
    address: z
      .string()
      .min(1, "Address is required")
      .max(1000, "Address too long")
      .optional(),
    pinCode: z
      .string()
      .min(6, "PIN code must be 6 characters")
      .max(6, "PIN code must be 6 characters")
      .regex(/^\d{6}$/, "Invalid PIN code format")
      .optional(),
    stateId: z.string().uuid("Invalid state ID").optional(),
    cityId: z.string().uuid("Invalid city ID").optional(),
  }),
});

export const deleteAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid address ID format"),
  }),
});
