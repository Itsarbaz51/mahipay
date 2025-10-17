import type { Request, Response } from "express";
import asyncHandler from "../../utils/AsyncHandler.js";
import CCPayoutValidationSchemas from "../../validations/bulkpay/ccPayoutValidation.schemas.js";
import CCPayoutServices from "../../services/bulkpay/ccPayout.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

class CCSenderController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const sender = await CCPayoutServices.createSender(userId, req.body);

    res
      .status(201)
      .json(ApiResponse.success(sender, "Sender created successfully", 201));
  });

  static uploadCardImage = asyncHandler(async (req: Request, res: Response) => {
    const validatedData =
      await CCPayoutValidationSchemas.UploadCardImage.parseAsync({
        senderId: req.body.senderId,
        cardImageType: req.body.cardImageType,
      });

    if (!req.file) {
      throw ApiError.badRequest("Card image file is required");
    }

    const updatedSender = await CCPayoutServices.uploadCardImage(
      validatedData.senderId,
      validatedData.cardImageType,
      req.file
    );

    res
      .status(200)
      .json(
        ApiResponse.success(updatedSender, "Card image uploaded successfully")
      );
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req?.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const result = await CCPayoutServices.listSenders(userId, req.body);

    res
      .status(200)
      .json(
        ApiResponse.success(result.senders, "Senders fetched successfully", 200)
      );
  });
}

class CCBeneficiaryController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const validatedData =
      await CCPayoutValidationSchemas.CreateBeneficiary.parseAsync(req.body);

    const userId = req?.user?.id;
    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const beneficiary = await CCPayoutServices.createBeneficiary(
      userId,
      validatedData
    );

    res
      .status(201)
      .json(
        ApiResponse.success(
          beneficiary,
          "Beneficiary created successfully",
          201
        )
      );
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req?.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const result = await CCPayoutServices.listBeneficiaries(userId, req.body);

    res
      .status(200)
      .json(
        ApiResponse.success(
          result.beneficiaries,
          "Beneficiaries fetched successfully",
          200
        )
      );
  });
}

class CCCollectionController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req?.user?.id;
    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const collection = await CCPayoutServices.createCollection(
      userId,
      req.body
    );

    res
      .status(201)
      .json(
        ApiResponse.success(collection, "Collection created successfully", 201)
      );
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const userId = req?.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user id");
    }

    const result = await CCPayoutServices.listCollections(userId, req.body);

    res
      .status(200)
      .json(
        ApiResponse.success(
          result.collections,
          "Collections fetched successfully",
          200
        )
      );
  });
}

export { CCSenderController, CCBeneficiaryController, CCCollectionController };
