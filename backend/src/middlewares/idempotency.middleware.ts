import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import { IdempotencyService } from "../services/idempotencyKey.service.js";

declare global {
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

export const idempotencyMiddleware = (options: { required?: boolean } = {}) => {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] as string;

      if (!idempotencyKey) {
        if (required)
          return next(ApiError.badRequest("Idempotency key is required"));
        return next();
      }

      if (!/^[a-zA-Z0-9_-]{1,255}$/.test(idempotencyKey)) {
        return next(ApiError.badRequest("Invalid idempotency key format"));
      }

      const userId = req.user?.id;

      await IdempotencyService.processIdempotencyKey(idempotencyKey, userId);

      req.idempotencyKey = idempotencyKey;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default idempotencyMiddleware;
