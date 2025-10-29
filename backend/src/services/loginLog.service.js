import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class LoginLogService {
    async getAllLoginLogs(payload) {
        const { page = 1, limit = 10, userId, startDate, endDate, search } = payload;
        const skip = (page - 1) * limit;


        const where = {};

        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }
        if (search) {
            where.OR = [
                { domainName: { contains: search } },
                { ipAddress: { contains: search } },
                { location: { contains: search } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: search } },
                            { lastName: { contains: search } },
                            { email: { contains: search } }
                        ]
                    }
                }
            ];
        }

        // Fetch logs and total count in parallel
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
        const result = {
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


        return result;
    }

    async getLoginLogById(id) {

        const log = await Prisma.loginLogs.findUnique({
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

        return log;
    }

    async createLoginLog(payload) {
        const created = await Prisma.loginLogs.create({
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

        return created;
    }

    async deleteLoginLog(id) {
        const deleted = await Prisma.loginLogs.delete({ where: { id } });
        if (!deleted) {
            throw ApiError.internal("Login log not found");
        }

        return deleted;
    }
}

export default LoginLogService;
