import AdminCityService from "../services/admin/city.service.js";
import EmployeeCityService from "../services/employee/city.service.js";
import RootCityService from "../services/root/city.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

export class CityController {
  static getAllCities = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    let result;
    if (currentUser.role === "ROOT") {
      result = await RootCityService.getAllCities(currentUser);
    } else if (currentUser.userType === "BUSINESS") {
      result = await AdminCityService.getAllCities(currentUser);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await EmployeeCityService.getAllCities(currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(result, "Cities fetched successfully", 200));
  });

  static getCityById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let city;

    if (currentUser.role === "ROOT") {
      city = await RootCityService.getCityById(id, currentUser);
    } else if (currentUser.userType === "BUSINESS") {
      city = await AdminCityService.getCityById(id, currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(city, "City fetched successfully", 200));
  });

  static upsertCity = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootCityService.upsertCity(currentUser, payload);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await RootCityService.upsertCity(currentUser, payload);
    } else {
      throw ApiError.unauthorized("Only Root can manage cities");
    }

    const message = payload.id
      ? "City updated successfully"
      : "City created successfully";
    return res.status(200).json(ApiResponse.success(result, message, 200));
  });

  static deleteCity = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    if (currentUser.role === "ROOT") {
      await RootCityService.deleteCity(id, currentUser);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      await RootCityService.deleteCity(id, currentUser);
    } else {
      throw ApiError.unauthorized("Only Root can delete cities");
    }

    return res
      .status(200)
      .json(ApiResponse.success({}, "City deleted successfully", 200));
  });
}

export default CityController;
