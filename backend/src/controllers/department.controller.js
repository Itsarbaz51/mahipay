// controllers/department.controller.js
import { RootDepartmentService } from "../services/root/rootDepartment.service.js";
import { AdminDepartmentService } from "../services/admin/adminDepartment.service.js";
import { EmployeeDepartmentService } from "../services/employee/employeeDepartment.service.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class DepartmentController {
  static async getAllDepartments(req, res, next) {
    try {
      const currentUser = req.user;
      const { page = 1, limit = 10, search } = req.query;

      let result;

      switch (currentUser.role) {
        case "ROOT":
          result = await RootDepartmentService.getAllDepartments(currentUser, {
            page,
            limit,
            search,
          });
          break;
        case "ADMIN":
          result = await AdminDepartmentService.getAllDepartments(currentUser, {
            page,
            limit,
            search,
          });
          break;
        case "EMPLOYEE":
          result = await EmployeeDepartmentService.getAllDepartments(
            currentUser,
            { page, limit, search }
          );
          break;
        default:
          throw ApiError.unauthorized("Invalid role");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, result, "Departments fetched successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentById(req, res, next) {
    try {
      const currentUser = req.user;
      const { id } = req.params;

      let department;

      switch (currentUser.role) {
        case "ROOT":
          department = await RootDepartmentService.getDepartmentById(
            id,
            currentUser
          );
          break;
        case "ADMIN":
          department = await AdminDepartmentService.getDepartmentById(
            id,
            currentUser
          );
          break;
        case "EMPLOYEE":
          department = await EmployeeDepartmentService.getDepartmentById(
            id,
            currentUser
          );
          break;
        default:
          throw ApiError.unauthorized("Invalid role");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, department, "Department fetched successfully")
        );
    } catch (error) {
      next(error);
    }
  }

  static async upsertDepartment(req, res, next) {
    try {
      const currentUser = req.user;
      const payload = req.body;
      let result;

      switch (currentUser.role) {
        case "ROOT":
          result = await RootDepartmentService.upsertDepartment(
            currentUser,
            payload
          );
          break;
        case "ADMIN":
          result = await AdminDepartmentService.upsertDepartment(
            currentUser,
            payload
          );
          break;
        case "EMPLOYEE":
          result = await EmployeeDepartmentService.upsertDepartment(
            currentUser,
            payload
          );
          break;
        default:
          throw ApiError.unauthorized("Invalid role");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            `Department ${result.action} successfully`
          )
        );
    } catch (error) {
      next(error);
    }
  }

  static async deleteDepartment(req, res, next) {
    try {
      const currentUser = req.user;
      const { id } = req.params;

      switch (currentUser.role) {
        case "ROOT":
          await RootDepartmentService.deleteDepartment(id, currentUser);
          break;
        case "ADMIN":
          await AdminDepartmentService.deleteDepartment(id, currentUser);
          break;
        case "EMPLOYEE":
          await EmployeeDepartmentService.deleteDepartment(id, currentUser);
          break;
        default:
          throw ApiError.unauthorized("Invalid role");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Department deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default DepartmentController;
