import { string, z } from "zod";

class AuthValidationSchemas {
  static get register() {
    return z
      .object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username cannot exceed 30 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
          )
          .transform((val) => val.trim()),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        profileImage: z
          .string()
          .url("Invalid image URL")
          .refine((url) => /\.(jpg|jpeg|png|webp)$/i.test(url), {
            message: "Profile must be an image (jpeg, jpg, png, webp)",
          })
          .optional(),
        email: z.string().email("Invalid email address"),
        phoneNumber: z
          .string()
          .regex(/^\d{10}$/, "Phone number must be 10 digits"),
        transactionPin: z
          .string()
          .regex(/^\d{4,6}$/, "Transaction PIN must be 4-6 digits"),
        // domainName: z.string().min(1, "Domain name is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
        roleId: z.string().uuid(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
  }

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

  static get updateProfile() {
    return z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, and underscores"
        )
        .transform((val) => val.trim())
        .optional(),
      firstName: z.string().min(1, "First name is required").optional(),
      lastName: z.string().min(1, "Last name is required").optional(),
      phoneNumber: z
        .string()
        .regex(/^\d{10}$/, "Phone number must be 10 digits")
        .optional(),
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
          // At least one update should be requested
          return data.newPassword || data.newTransactionPin;
        },
        {
          message:
            "Either new password or new transaction PIN must be provided",
        }
      );
  }

  static get updateProfileImage() {
    return z.object({
      // This schema is mainly for validation, file handling is done by multer
    });
  }
}

export default AuthValidationSchemas;
