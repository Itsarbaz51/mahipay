import type { Response } from "express";

class ApiError extends Error {
  statusCode: number;
  errors: any[];
  success: boolean;

  constructor(
    message: string = "Something went wrong!",
    statusCode: number = 500,
    errors: any[] = []
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = "Bad Request", errors: any[] = []) {
    return new ApiError(message, 400, errors);
  }

  static unauthorized(message: string = "Unauthorized", errors: any[] = []) {
    return new ApiError(message, 401, errors);
  }

  static forbidden(message: string = "Forbidden", errors: any[] = []) {
    return new ApiError(message, 403, errors);
  }

  static notFound(message: string = "Not Found", errors: any[] = []) {
    return new ApiError(message, 404, errors);
  }

  static conflict(message: string = "Conflict", errors: any[] = []) {
    return new ApiError(message, 409, errors);
  }

  static internal(
    message: string = "Internal Server Error",
    errors: any[] = []
  ) {
    return new ApiError(message, 500, errors);
  }
}

export { ApiError };
