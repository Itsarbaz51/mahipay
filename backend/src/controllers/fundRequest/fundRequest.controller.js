import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import FundRequestService from "../services/FundRequestService.js";

class FundRequestController {
  // Get all fund requests (for admin) or user's own requests
  static index = asyncHandler(async (req, res) => {
    const result = await FundRequestService.listFundRequests(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Fund requests fetched successfully", result));
  });

  // Get single fund request details
  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.getFundRequestById(id, req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, "Fund request fetched successfully", result));
  });

  // Create new fund request
  static store = asyncHandler(async (req, res) => {
    const result = await FundRequestService.createFundRequest(
      req.body,
      req.user,
      req.files
    );
    return res
      .status(201)
      .json(new ApiResponse(201, "Fund request created successfully", result));
  });

  // Update fund request status (admin only)
  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.updateFundRequestStatus(
      id,
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Fund request updated successfully", result));
  });

  // Verify Razorpay payment
  static verification = asyncHandler(async (req, res) => {
    const result = await FundRequestService.verifyRazorpayPayment(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Payment verified successfully", result));
  });

  // Delete fund request
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await FundRequestService.deleteFundRequest(id, req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, "Fund request deleted successfully"));
  });

  // Get wallet balance
  static getWalletBalance = asyncHandler(async (req, res) => {
    const result = await FundRequestService.getWalletBalance(req.user);
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Wallet balance fetched successfully", result)
      );
  });

  // Create Razorpay order
  static createRazorpayOrder = asyncHandler(async (req, res) => {
    const result = await FundRequestService.createRazorpayOrder(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(new ApiResponse(200, "Order created successfully", result));
  });

  // Get fund request statistics
  static getStats = asyncHandler(async (req, res) => {
    const result = await FundRequestService.getFundRequestStats(req.user);
    return res
      .status(200)
      .json(new ApiResponse(200, "Statistics fetched successfully", result));
  });

  // Reject and refund topup (admin only)
  static rejectTopup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.rejectAndRefundTopup(id, req.user);
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Topup rejected and refunded successfully", result)
      );
  });
}

export default FundRequestController;
