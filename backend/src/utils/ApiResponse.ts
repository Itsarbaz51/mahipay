class ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T | null;
  success: boolean;

  constructor(
    statusCode: number,
    message: string = "Success",
    data: T | null = null
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }

  static success<T>(
    data: T,
    message: string = "Success",
    statusCode: number = 200
  ): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, message, data);
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      statusCode: this.statusCode,
    };
  }
}

export { ApiResponse };
