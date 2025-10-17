import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

// Extend Express Request type
declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
