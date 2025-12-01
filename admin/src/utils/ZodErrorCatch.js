import { z } from "zod";

export const ZodErrorCatch = (error) => {
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const fieldErrors = error.errors.map((err) => {
      const field = err.path.join(".");
      return field ? `${field}: ${err.message}` : err.message;
    });
    return fieldErrors.join(", ");
  }

  // Handle API response errors
  if (error.response?.data) {
    const apiMessage = error.response.data.message || "Something went wrong";
    const fieldErrors = error.response.data.errors || [];

    if (Array.isArray(fieldErrors)) {
      const fieldMessages = fieldErrors.map((err) => err.message).join(", ");
      return fieldMessages ? `${apiMessage}: ${fieldMessages}` : apiMessage;
    }

    return apiMessage;
  }

  // Handle network errors
  if (error.message) {
    return error.message;
  }

  return "Something went wrong";
};

export default ZodErrorCatch;
