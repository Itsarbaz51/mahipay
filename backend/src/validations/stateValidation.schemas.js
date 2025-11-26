// validations/stateValidation.schemas.js
import { z } from "zod";

export const getAllStatesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
  }),
});

export const getStateByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid state ID format"),
  }),
});

export const upsertStateSchema = z.object({
  body: z.object({
    id: z.string().uuid("Invalid state ID format").optional(),
    stateName: z
      .string()
      .min(1, "State name is required")
      .max(100, "State name too long"),
    stateCode: z
      .string()
      .min(1, "State code is required")
      .max(10, "State code too long")
      .optional(),
  }),
});

export const deleteStateSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid state ID format"),
  }),
});
