import { z } from "zod";

class AuthValidationSchemas {
  static get login() {
    return z.object({
      emailOrUsername: z.string(),
      password: z.string(),
    });
  }

  static get forgotPassword() {
    return z.object({
      email: z.string().email("Invalid email address"),
    });
  }

  static get resetPassword() {
    return z.object({
      token: z.string().min(1, "Token is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
    });
  }

  static get updateCredentials() {
    return z
      .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .optional(),
        confirmNewPassword: z.string().optional(),
        currentTransactionPin: z
          .string()
          .regex(/^\d{4,6}$/, "Current transaction PIN must be 4-6 digits")
          .optional(),
        newTransactionPin: z
          .string()
          .regex(/^\d{4,6}$/, "New transaction PIN must be 4-6 digits")
          .optional(),
        confirmNewTransactionPin: z.string().optional(),
      })
      .refine(
        (data) => {
          if (
            data.newPassword &&
            data.newPassword !== data.confirmNewPassword
          ) {
            return false;
          }
          return true;
        },
        {
          message: "New passwords do not match",
          path: ["confirmNewPassword"],
        }
      )
      .refine(
        (data) => {
          if (
            data.newTransactionPin &&
            data.newTransactionPin !== data.confirmNewTransactionPin
          ) {
            return false;
          }
          return true;
        },
        {
          message: "New transaction PINs do not match",
          path: ["confirmNewTransactionPin"],
        }
      )
      .refine(
        (data) => {
          return data.newPassword || data.newTransactionPin;
        },
        {
          message:
            "Either new password or new transaction PIN must be provided",
        }
      );
  }
}

export default AuthValidationSchemas;