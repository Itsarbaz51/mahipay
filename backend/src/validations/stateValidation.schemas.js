import { z } from "zod";

export const getAllStatesSchema = z.object({
  query: z.object({
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
      .min(2, "State code is required")
      .max(2, "State code too long")
      .optional(),
  }),
});

export const deleteStateSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid state ID format"),
  }),
});
