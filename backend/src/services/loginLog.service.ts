import Prisma from "../db/db.js";
import type {
    LoginLogCreateInput,
    LoginLogUpdateInput,
    LoginLogFilterParams,
    LoginLogListResponse,
    UserLoginLogsParams,
} from "../types/loginLog.types.js";

export class LoginLogService {
    async getAllLoginLogs(payload: LoginLogFilterParams): Promise<LoginLogListResponse> {
        const { page = 1, limit = 10, userId, startDate, endDate, search } = payload;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }
        if (search) {
            where.OR = [
                { domainName: { contains: search, mode: "insensitive" } },
                { ipAddress: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search, mode: "insensitive" } },
                            { lastName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } }
                        ]
                    }
                }
            ];
        }

        // Fetch logs and total count
        const [loginLogs, total] = await Promise.all([
            Prisma.loginLogs.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            Prisma.loginLogs.count({ where })
        ]);

        const totalPages = Math.ceil(total / limit);
        return {
            data: loginLogs,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }

    async getLoginLogById(id: string) {
        return await Prisma.loginLogs.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    }

    async createLoginLog(payload: LoginLogCreateInput) {
        return await Prisma.loginLogs.create({
            data: payload,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    }

    async deleteLoginLog(id: string) {
        return await Prisma.loginLogs.delete({
            where: { id }
        });
    }
}

export default LoginLogService;
