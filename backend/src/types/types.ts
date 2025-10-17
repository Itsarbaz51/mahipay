import type { Request, Response, NextFunction } from "express";

export type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export interface FindPost {
  fileUrl?: string;
}
