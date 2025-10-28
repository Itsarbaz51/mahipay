import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import SystemSettingService from "../services/systemSetting.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { SystemSettingInput } from "../types/systemSetting.types.js";
import Helper from "../utils/helper.js";

class SystemSettingController {

  static upsert = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized("User not authenticated");

    const data: SystemSettingInput = { ...req.body };

    const uploadedFilePaths: string[] = [];
    if (req.files) {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      if (files.companyLogo?.[0]) {
        data.companyLogo = files.companyLogo[0].path;
        uploadedFilePaths.push(files.companyLogo[0].path);
      }
      if (files.favIcon?.[0]) {
        data.favIcon = files.favIcon[0].path;
        uploadedFilePaths.push(files.favIcon[0].path);
      }
    }

    try {
      const setting = await SystemSettingService.upsert(data, userId);

      return res
        .status(200)
        .json(
          ApiResponse.success(setting, "System setting saved successfully", 200)
        );
    } finally {
      // Delete temp uploaded files (from local disk)
      for (const filePath of uploadedFilePaths) {
        await Helper.deleteOldImage(filePath);
      }
    }
  });

  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) throw ApiError.internal("Failed to access user id setting");

    const setting = await SystemSettingService.getById(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(setting, "System setting fetched successfully", 200)
      );
  });

  static index = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sort = "desc" } = req.query as any;
    const data = await SystemSettingService.getAll(
      Number(page),
      Number(limit),
      sort
    );
    return res
      .status(200)
      .json(ApiResponse.success(data, "System settings fetched", 200));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("System setting ID is required");

    const setting = await SystemSettingService.delete(id);
    return res
      .status(200)
      .json(ApiResponse.success(setting, "System setting deleted", 200));
  });
}

export default SystemSettingController;
