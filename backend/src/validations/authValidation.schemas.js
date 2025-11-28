import { file, z } from "zod";

const RoleEnums = z.enum(["business", "root", "employee"]);

class AuthValidationSchemas {
  // LOGIN
  static get login() {
    return z.object({
      body: z.object({
        userType: RoleEnums,
        emailOrUsername: z
          .string()
          .min(1, "Email or username is required")
          .max(255, "Email or username is too long"),
        password: z
          .string()
          .min(1, "Password is required")
          .max(255, "Password is too long"),

        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        accuracy: z.number().min(0).optional(),
      }),
    });
  }

  // confirm Password Reset
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
        email: z.string().email("Invalid email").max(255),
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
            .max(255),

          newPassword: z
            .string()
            .min(8)
            .max(255)
            .regex(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
              "Password must contain uppercase, lowercase, number, and special character"
            )
            .optional(),

          confirmNewPassword: z.string().optional(),

          currentTransactionPin: z
            .string()
            .regex(/^\d{4,6}$/, "Current PIN must be 4–6 digits")
            .optional(),

          newTransactionPin: z
            .string()
            .regex(/^\d{4,6}$/, "New PIN must be 4–6 digits")
            .optional(),

          confirmNewTransactionPin: z.string().optional(),
        })
        .refine(
          (d) => !d.newPassword || d.confirmNewPassword === d.newPassword,
          {
            message: "New passwords do not match",
            path: ["confirmNewPassword"],
          }
        )
        .refine(
          (d) =>
            !d.newTransactionPin ||
            d.confirmNewTransactionPin === d.newTransactionPin,
          {
            message: "New transaction PINs do not match",
            path: ["confirmNewTransactionPin"],
          }
        )
        .refine((d) => d.newPassword || d.newTransactionPin, {
          message:
            "Either new password or new transaction PIN must be provided",
          path: ["newPassword"], // or a general error
        }),

      params: z.object({
        userId: z.string().uuid("Invalid User ID format"),
      }),
    });
  }

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
          .transform((val) => val.trim())
          .optional(),
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        phoneNumber: z
          .string()
          .regex(/^\d{10}$/, "Phone number must be 10 digits")
          .optional(),
        email: z.string().email("Invalid email address").optional(),
        roleId: z.string().uuid("Invalid role ID").optional(),
      }),
    });
  }
}

export default AuthValidationSchemas;
