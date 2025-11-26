// validations/cityValidation.schemas.js
import { z } from "zod";

export const getAllCitiesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
  }),
});

export const getCityByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid city ID format"),
  }),
});

export const upsertCitySchema = z.object({
  body: z.object({
    id: z.string().uuid("Invalid city ID format").optional(),
    cityName: z.string().min(1, "City name is required").max(100, "City name too long"),
    cityCode: z.string().min(1, "City code is required").max(10, "City code too long").optional(),
  }),
});

export const deleteCitySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid city ID format"),
  }),
});