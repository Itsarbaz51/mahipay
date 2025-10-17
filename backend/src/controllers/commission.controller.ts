import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  CommissionEarningService,
  CommissionSettingService,
} from "../services/commission.service.js";

export class CommissionSettingController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const setting =
      await CommissionSettingService.createOrUpdateCommissionSetting(
        req.body,
        userId as string
      );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          setting,
          "Commission setting saved successfully",
          200
        )
      );
  });

  static getByRoleOrUser = asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const userId = req.query.userId as string | undefined;

    const settings =
      await CommissionSettingService.getCommissionSettingsByRoleOrUser(
        roleId,
        userId
      );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          settings,
          "Commission settings fetched successfully",
          200
        )
      );
  });
}

export class CommissionEarningController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const createdBy = req.user?.id;
    if (!createdBy) throw new Error("Unauthorized");

    const data = {
      ...req.body,
      createdBy,
    };

    const earning =
      await CommissionEarningService.createCommissionEarning(data);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          earning,
          "Commission earning recorded successfully",
          201
        )
      );
  });

  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { userId, fromUserId, serviceId, transactionId } = req.query;

    const filters: {
      userId?: string;
      fromUserId?: string;
      serviceId?: string;
      transactionId?: string;
    } = {};

    if (typeof userId === "string") filters.userId = userId;
    if (typeof fromUserId === "string") filters.fromUserId = fromUserId;
    if (typeof serviceId === "string") filters.serviceId = serviceId;
    if (typeof transactionId === "string")
      filters.transactionId = transactionId;

    const earnings =
      await CommissionEarningService.getCommissionEarnings(filters);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          earnings,
          "Commission earnings fetched successfully",
          200
        )
      );
  });
}
