import type { Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const error = err as { statusCode?: number; message?: string };

  return res.status(error.statusCode || 500).json({
    status: "error",
    message: error.message || "Internal Server Error",
  });
};
