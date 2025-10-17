import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export const validateRequest = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      return next(result.error); 
    }
    req.body = result.data;
    next();
  };
};
