import { z } from "zod";

// Remove "root" from allowed roles for client-side validation
const RoleEnums = z.enum(["root", "business", "employee"]);

class AuthValidationSchemas {
  // LOGIN
  static get login() {
    return z.object({
      body: z.object({
        userType: RoleEnums,
        emailOrUsername: z
          .string()
          .min(1, "Email or username is required")
          .max(255, "Email or username must be less than 255 characters")
          .trim(),
        password: z
          .string()
          .min(1, "Password is required")
          .max(255, "Password must be less than 255 characters"),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        accuracy: z.number().min(0).optional(),
      }),
    });
  }

  // CONFIRM PASSWORD RESET
  static get confirmPasswordReset() {
    return z.object({
      query: z.object({
        token: z.string().min(1, "Reset token is required"),
        type: RoleEnums,
      }),
    });
  }

  // FORGOT PASSWORD
  static get forgotPassword() {
    return z.object({
      body: z.object({
        userType: RoleEnums,
        email: z
          .string()
          .email("Invalid email address")
          .max(255, "Email must be less than 255 characters")
          .trim()
          .toLowerCase(),
      }),
    });
  }

  // UPDATE CREDENTIALS
  static get updateCredentials() {
    return z.object({
      body: z
        .object({
          currentPassword: z
            .string()
            .min(1, "Current password is required")
            .max(255, "Current password must be less than 255 characters"),

          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(255, "Password must be less than 255 characters")
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            )
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
          (data) =>
            !data.newPassword || data.confirmNewPassword === data.newPassword,
          {
            message: "New passwords do not match",
            path: ["confirmNewPassword"],
          }
        )
        .refine(
          (data) =>
            !data.newTransactionPin ||
            data.confirmNewTransactionPin === data.newTransactionPin,
          {
            message: "New transaction PINs do not match",
            path: ["confirmNewTransactionPin"],
          }
        )
        .refine((data) => data.newPassword || data.newTransactionPin, {
          message:
            "Either new password or new transaction PIN must be provided",
          path: ["newPassword"],
        }),

      params: z.object({
        userId: z.string().uuid("Invalid user ID format"),
      }),
    });
  }

  // UPDATE PROFILE
  static get updateProfile() {
    return z.object({
      body: z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username cannot exceed 30 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
          )
          .transform((val) => val.trim().toLowerCase())
          .optional(),
        firstName: z
          .string()
          .min(1, "First name is required")
          .max(50, "First name cannot exceed 50 characters")
          .transform((val) => val.trim())
          .optional(),
        lastName: z
          .string()
          .min(1, "Last name is required")
          .max(50, "Last name cannot exceed 50 characters")
          .transform((val) => val.trim())
          .optional(),
        phoneNumber: z
          .string()
          .regex(/^\d{10}$/, "Phone number must be exactly 10 digits")
          .optional(),
        email: z
          .string()
          .email("Invalid email address")
          .transform((val) => val.trim().toLowerCase())
          .optional(),
        roleId: z.string().uuid("Invalid role ID format").optional(),
      }),
    });
  }

  // REFRESH TOKEN
  static get refreshToken() {
    return z.object({
      cookies: z.object({
        refreshToken: z.string().min(1, "Refresh token is required"),
      }),
    });
  }

  // VERIFY EMAIL
  static get verifyEmail() {
    return z.object({
      query: z.object({
        token: z.string().min(1, "Verification token is required"),
      }),
    });
  }
}

export default AuthValidationSchemas;
