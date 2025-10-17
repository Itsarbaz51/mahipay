import type { Request, Response, NextFunction } from "express";
import type { AsyncHandlerFn } from "../types/types.js";

const asyncHandler = (requestHandler: AsyncHandlerFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
