import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import AdminAddressService from "../services/admin/address.service.js";
import asyncHandler from "../utils/AsyncHandler.js";

export class AddressController {
  static getAddressById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let address;

    if (currentUser.userType === "BUSINESS") {
      address = await AdminAddressService.getAddressById(id, currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(address, "Address fetched successfully", 200));
  });

  static createAddress = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.userType === "BUSINESS") {
      result = await AdminAddressService.createAddress(currentUser, payload);
    } else {
      throw ApiError.unauthorized("Only Business users can create addresses");
    }

    return res
      .status(201)
      .json(ApiResponse.success(result, "Address created successfully", 201));
  });

  static updateAddress = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const payload = req.body;

    let result;

    if (currentUser.userType === "BUSINESS") {
      result = await AdminAddressService.updateAddress(
        id,
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized("Only Business users can update addresses");
    }

    return res
      .status(200)
      .json(ApiResponse.success(result, "Address updated successfully", 200));
  });

  static deleteAddress = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    if (currentUser.userType === "BUSINESS") {
      await AdminAddressService.deleteAddress(id, currentUser);
    } else {
      throw ApiError.unauthorized("Only Business users can delete addresses");
    }

    return res
      .status(200)
      .json(ApiResponse.success({}, "Address deleted successfully", 200));
  });
}

export default AddressController;
