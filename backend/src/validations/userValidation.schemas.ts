import { z } from "zod";

class UserValidationSchemas {
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

      email: z.string().email("Invalid email address").optional(),

      roleId: z.uuid().min(1, "Role cannot be empty").optional(),
    });
  }

  static get updateProfileImage() {
    return z.object({
      // This schema is mainly for validation, file handling is done by multer
    });
  }

  static get deactivateUser() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Deactivated by admin"),
    });
  }
  static get reactivateUser() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Reactivated by admin"),
    });
  }

  static get deleteUser() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Deleted by admin"),
    });
  }
}

export default UserValidationSchemas;
