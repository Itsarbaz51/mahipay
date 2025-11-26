import AdminStateService from "../services/admin/state.service.js";
import EmployeeStateService from "../services/employee/state.service.js";
import RootStateService from "../services/root/state.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

export class StateController {
  static getAllStates = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    let result;
    if (currentUser.role === "ROOT") {
      result = await RootStateService.getAllStates(currentUser);
    } else if (currentUser.userType === "BUSINESS") {
      result = await AdminStateService.getAllStates(currentUser);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await EmployeeStateService.getAllStates(currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(result, "States fetched successfully", 200));
  });

  static getStateById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let state;

    if (currentUser.role === "ROOT") {
      state = await RootStateService.getStateById(id, currentUser);
    } else if (currentUser.userType === "BUSINESS") {
      state = await AdminStateService.getStateById(id, currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(state, "State fetched successfully", 200));
  });

  static upsertState = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootStateService.upsertState(currentUser, payload);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await RootStateService.upsertState(currentUser, payload);
    } else {
      throw ApiError.unauthorized("Only Root can manage states");
    }

    const message = payload.id
      ? "State updated successfully"
      : "State created successfully";
    return res.status(200).json(ApiResponse.success(result, message, 200));
  });

  static deleteState = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    if (currentUser.role === "ROOT") {
      await RootStateService.deleteState(id, currentUser);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      await RootStateService.deleteState(id, currentUser);
    } else {
      throw ApiError.unauthorized("Only Root can delete states");
    }

    return res
      .status(200)
      .json(ApiResponse.success({}, "State deleted successfully", 200));
  });
}

export default StateController;
