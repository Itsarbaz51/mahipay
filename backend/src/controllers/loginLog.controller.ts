import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";

class LoginLogController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {});
  static update = asyncHandler(async (req: Request, res: Response) => {});
  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

export default LoginLogController;
