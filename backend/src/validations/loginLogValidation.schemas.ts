import { z } from "zod";

class LoginLogsValidationSchemas {
    // Custom IP address validation
    private static ipAddressSchema = z.string().refine(
        (ip) => {
            // IPv4 validation
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (ipv4Regex.test(ip)) {
                const parts = ip.split('.');
                return parts.every(part => {
                    const num = parseInt(part, 10);
                    return num >= 0 && num <= 255;
                });
            }

            // IPv6 validation (basic)
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            if (ipv6Regex.test(ip)) {
                return true;
            }

            // IPv6 compressed format
            const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:){1,7}:|::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
            return ipv6CompressedRegex.test(ip);
        },
        {
            message: "Invalid IP address format"
        }
    );

    static get CreateLoginLogSchema() {
        return z.object({
            userId: z.string().uuid("Invalid user ID format"),
            domainName: z.string().min(1).max(255, "Domain name is too long"),
            ipAddress: this.ipAddressSchema,
            userAgent: z.string().max(1000).optional(),
            location: z.string().max(1000).optional(),
            latitude: z.coerce.number().min(-90).max(90).optional(),
            longitude: z.coerce.number().min(-180).max(180).optional(),
        });
    }

    static get UpdateLoginLogSchema() {
        return z.object({
            domainName: z.string().min(1).max(255, "Domain name is too long").optional(),
            ipAddress: this.ipAddressSchema.optional(),
            userAgent: z.string().max(1000).optional(),
            location: z.string().max(1000).optional(),
            latitude: z.coerce.number().min(-90).max(90).optional(),
            longitude: z.coerce.number().min(-180).max(180).optional(),
        }).refine(
            (data) => {
                // At least one field should be provided for update
                return Object.keys(data).some(key => data[key as keyof typeof data] !== undefined);
            },
            {
                message: "At least one field must be provided for update",
            }
        );
    }

    static get ListLoginLogsSchema() {
        return z.object({
            page: z.coerce.number().int().positive().optional().default(1),
            limit: z.coerce.number().int().positive().max(100).optional().default(10),
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
            search: z.string().min(1).max(255).optional(),
        }).refine(
            (data) => {
                if (data.startDate && data.endDate) {
                    return data.startDate <= data.endDate;
                }
                return true;
            },
            {
                message: "startDate must be before or equal to endDate",
                path: ["startDate"],
            }
        );
    }

    static get GetLoginLogByIdSchema() {
        return z.object({
            id: z.string().uuid("Invalid login log ID format"),
        });
    }

    static get DeleteLoginLogSchema() {
        return z.object({
            id: z.string().uuid("Invalid login log ID format"),
        });
    }

    static getUserLoginLogsSchema() {
        return z.object({
            userId: z.string().uuid("Invalid user ID format"),
            limit: z.coerce.number().int().positive().max(100).optional().default(10),
        });
    }
}

export default LoginLogsValidationSchemas;